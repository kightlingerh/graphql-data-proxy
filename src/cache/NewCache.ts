import { isNonEmpty, snoc } from 'fp-ts/lib/Array';
import { left, right } from 'fp-ts/lib/Either';
import { absurd, constVoid, Endomorphism, pipe } from 'fp-ts/lib/function';
import { IO, sequenceArray as sequenceArrayIO } from 'fp-ts/lib/IO';
import { NonEmptyArray, of } from 'fp-ts/lib/NonEmptyArray';
import { isNone, isSome, none, Option, some, map as mapO, Some, chain } from 'fp-ts/lib/Option';
import { Reader } from 'fp-ts/lib/Reader';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { Tree } from 'fp-ts/lib/Tree';
import { computed, shallowReactive, shallowRef } from 'vue';
import {
	Node,
	TypeOf,
	TypeOfMergedVariables,
	TypeOfPartial,
	TypeOfRefs,
	Path,
	TypeNode,
	ArrayNode,
	NonEmptyArrayNode,
	OptionNode,
	MapNode,
	SumNode,
	TypeOfCacheEntry
} from '../../lib/node/index';
import { Ref } from '../../lib/node/index';
import { useNodeMergedVariablesEncoder } from '../node/Variables';
import { isEmptyObject } from '../shared';
import { isPrimitiveNode, traverseMapWithKey } from './shared';
import { validate } from './validate';

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export interface Persist {
	store(key: string, value: unknown): TaskEither<CacheError, void>;

	restore<T>(key: string): TaskEither<CacheError, T>;

	delete(key: string): TaskEither<CacheError, void>;

	update<T>(key: string, f: Endomorphism<T>): TaskEither<CacheError, void>;
}

export interface CacheDependencies {
	id?: string;
	persist?: Persist;
	useImmutableArrays?: boolean;
}

export interface CacheWriteResult extends IO<Evict> {}

export interface Evict extends IO<void> {}

export interface Cache<R extends TypeNode<any, any>> {
	read: Reader<TypeOfMergedVariables<R>, IO<Option<TypeOf<R>>>>;
	write: Reader<TypeOfMergedVariables<R>, Reader<TypeOfPartial<R>, CacheWriteResult>>;
	toEntries: Reader<TypeOfMergedVariables<R>, IO<TypeOfRefs<R>>>;
}

export function make(deps: CacheDependencies) {
	return <S extends TypeNode<any, any>>(schema: S) => {
		const rootPath = of(deps.id ?? 'root');
		const uniqueNodes = new Map<string, any>();
		const cache: TypeOfCacheEntry<S> = useTypeNodeCacheEntry(schema, rootPath, uniqueNodes, {});

		if (__DEV__) {
			console.log('cache', cache);
		}

		return <R extends TypeNode<any, any>>(request: R) => {
			if (__DEV__) {
				const errors = validate(schema, request);
				if (isNonEmpty(errors)) {
					return left<CacheError, Cache<R>>(errors);
				}
			}
			return right<CacheError, Cache<R>>({
				read: (variables) => () => read(schema, request, rootPath, uniqueNodes, deps, variables, cache),
				write: (variables) => (data) => () =>
					write(data, schema, request, rootPath, uniqueNodes, deps, variables, cache),
				toEntries: (variables) => () =>
					toEntries(schema, request, rootPath, uniqueNodes, deps, variables, cache)
			});
		};
	};
}


abstract class CacheNode<N extends Node> {
	static unique: Map<string, CacheNode<any>> = new Map()
	readonly entry: TypeOfCacheEntry<N>
	constructor(readonly schemaNode: N, readonly path: Path,) {
	}
	static makeEntry<T extends Node>(node: T): TypeOfCacheEntry<T> {
		if (isPrimitiveNode(node) || node?.options?.isEntity === true) {
			return shallowRef<Option<TypeOf<T>>>(none) as TypeOfCacheEntry<T>;
		}
		switch (node.tag) {
			case 'Type':
				const entry: any = {};
				for (const k in (node as TypeNode<any, any>).members) {
					if ((node as TypeNode<any, any>).members[k].tag !== 'Mutation') {
						const member: Node = (node as TypeNode<any, any>).members[k];
						entry[k] = isEmptyObject(member.variables) ? CacheNode.makeEntry(member) : new Map()
					}
				}
				return shallowReactive(entry) as TypeOfCacheEntry<T>;
			case 'Array':
				return shallowReactive([]) as TypeOfCacheEntry<T>;
			case 'Map':
				return shallowReactive(new Map()) as TypeOfCacheEntry<T>;
			default:
				return shallowRef<Option<TypeOf<T>>>(none) as TypeOfCacheEntry<T>;
		}
	}
}


function useCustomCache(
	uniqueNodes: Map<string, any>,
	member: Node,
	path: Path,
	id: string,
	variables: Record<string, unknown>,
	data?: any
) {
	const entry = uniqueNodes.get(id);
	if (entry) {
		return entry;
	} else {
		const newEntry = useCacheEntry(member, path, uniqueNodes, variables, data);
		uniqueNodes.set(id, newEntry);
		return newEntry;
	}
}

function useTypeNodeCacheEntry(
	schema: TypeNode<any, any>,
	path: Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, unknown>,
	data?: any
) {
	const x: any = {};
	for (const k in schema.members) {
		if (schema.members[k].tag !== 'Mutation') {
			const member: Node = schema.members[k];
			const newPath = snoc(path, k);
			if ((member.tag === 'Map' || member.tag === 'Type') && member?.options?.toId !== undefined) {
				// @ts-ignore
				const id = member.options.toId(newPath, variables, data);
				if (id) {
					x[k] = useCustomCache(uniqueNodes, member, newPath, id, variables, data);
				} else {
					x[k] = useCacheEntry(member, newPath, uniqueNodes, variables, data);
				}
			} else if (!isEmptyObject(member.variables)) {
				x[k] = new Map();
			} else {
				x[k] = useCacheEntry(member, newPath, uniqueNodes, variables, data);
			}
		}
	}
	return shallowReactive(x);
}

function useMapNodeCacheEntry(
	schema: MapNode<any, any, any, any, any, any>,
	path: Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, unknown>,
	data?: any
) {
	if (schema?.options?.toId) {
		const id = schema.options.toId(path, variables, data) as string;
		if (id) {
			const entry = uniqueNodes.get(id);
			if (entry) {
				return entry;
			} else {
				const newEntry = shallowReactive(new Map());
				uniqueNodes.set(id, newEntry);
				return newEntry;
			}
		}
	}
	return shallowReactive(new Map());
}

function useCacheEntry<T extends Node>(
	node: T,
	path: Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, unknown>,
	data?: any
): TypeOfCacheEntry<T> {
	if (isPrimitiveNode(node) || !!node?.options?.isEntity) {
		return shallowRef<Option<TypeOf<T>>>(none) as TypeOfCacheEntry<T>;
	}
	switch (node.tag) {
		case 'Type':
			return useTypeNodeCacheEntry(node as any, path, uniqueNodes, variables, data) as TypeOfCacheEntry<T>;
		case 'Array':
			return shallowReactive([]) as TypeOfCacheEntry<T>;
		case 'Map':
			return useMapNodeCacheEntry(node as any, path, uniqueNodes, variables, data);
		case 'Mutation':
			return useCacheEntry((node as any).result, path, uniqueNodes, variables, data) as TypeOfCacheEntry<T>;
		default:
			return shallowRef<Option<TypeOf<T>>>(none) as TypeOfCacheEntry<T>;
	}
}
