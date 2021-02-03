import { isNonEmpty, snoc } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import { absurd, constVoid, Endomorphism, pipe } from 'fp-ts/lib/function'
import { IO, sequenceArray as sequenceArrayIO } from 'fp-ts/lib/IO'
import { NonEmptyArray, of } from 'fp-ts/lib/NonEmptyArray'
import {isNone, isSome, none, Option, some, map as mapO, Some, chain} from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { Tree } from 'fp-ts/lib/Tree'
import { computed, shallowReactive, shallowRef } from 'vue'
import * as N from '../node'
import { Ref } from '../node'
import { isEmptyObject } from '../shared'
import { isPrimitiveNode } from './shared'
import { validate } from './validate'

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export interface Persist {
	store(key: string, value: unknown): TaskEither<CacheError, void>

	restore<T>(key: string): TaskEither<CacheError, T>

	delete(key: string): TaskEither<CacheError, void>

	update<T>(key: string, f: Endomorphism<T>): TaskEither<CacheError, void>
}

export interface CacheDependencies {
	id?: string
	persist?: Persist
	useImmutableArrays?: boolean
}

export interface CacheWriteResult extends IO<Evict> {}

export interface Evict extends IO<void> {}

export interface Cache<R extends N.SchemaNode<any, any>> {
	read: Reader<N.TypeOfMergedVariables<R>, IO<Option<N.TypeOf<R>>>>
	write: Reader<N.TypeOfMergedVariables<R>, Reader<N.TypeOfPartial<R>, CacheWriteResult>>
	toEntries: Reader<N.TypeOfMergedVariables<R>, IO<N.TypeOfRefs<R>>>
}

export function make(deps: CacheDependencies) {
	return <S extends N.SchemaNode<any, any>>(schema: S) => {
		const rootPath = of(deps.id ?? 'root')
		const uniqueNodes = new Map<string, any>()
		const cache: object = useTypeNodeCacheEntry(schema, rootPath, uniqueNodes, {})
		return <R extends N.SchemaNode<any, any>>(request: R) => {
			const errors = validate(schema, request)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				return right<CacheError, Cache<R>>({
					read: (variables) => () => read(schema, request, rootPath, uniqueNodes, deps, variables, cache),
					write: (variables) => (data) => () =>
						write(data, schema, request, rootPath, uniqueNodes, deps, variables, cache),
					toEntries: (variables) => () =>
						toEntries(schema, request, rootPath, uniqueNodes, deps, variables, cache)
				})
			}
		}
	}
}

function toEntries(
	schema: N.Node,
	request: N.Node,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: any
): any {
	if (isPrimitiveNode(schema) || !!schema.__isEntity) {
		return cache
	}
	if (!!request.__isEntity) {
		return computed(() => read(schema, request, path, uniqueNodes, deps, variables, cache))
	}
	switch (request.tag) {
		case 'Type':
			return toEntriesTypeNode(schema as N.TypeNode<any, any>, request, path, uniqueNodes, deps, variables, cache)
		case 'Array':
			return toEntriesArrayNode(schema as N.ArrayNode<any>, request, path, uniqueNodes, deps, variables, cache)
		case 'NonEmptyArray':
			return toEntriesNonEmptyArrayNode(
				schema as N.NonEmptyArrayNode<any>,
				request,
				path,
				uniqueNodes,
				deps,
				variables,
				cache
			)
		case 'Option':
			return toEntriesOptionNode(schema as N.OptionNode<any>, request, path, uniqueNodes, deps, variables, cache)
		case 'Sum':
			return toEntriesSumNode(schema as N.SumNode<any>, request, path, uniqueNodes, deps, variables, cache)
		default:
			return cache
	}
}

function toEntriesTypeNode(
	schema: N.TypeNode<any, any>,
	request: N.TypeNode<any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	entry: any
) {
	const x: any = {}
	for (const k in request.members) {
		const keyPath = snoc(path, k)
		x[k] = toEntries(
			schema.members[k],
			request.members[k],
			keyPath,
			uniqueNodes,
			deps,
			variables,
			useMemberCacheEntry(
				schema.members[k],
				keyPath,
				uniqueNodes,
				variables,
				entry[k],
				newEntry => {entry[k] = newEntry},
			)
		)
	}
	return x
}

function toEntriesArrayNode(
	schema: N.ArrayNode<any>,
	request: N.ArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: any[]
) {
	return cache.map((val, i) => toEntries(schema.item, request.item, snoc(path, i), uniqueNodes, deps, variables, val))
}

function toEntriesNonEmptyArrayNode(
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Ref<Option<NonEmptyArray<any>>>
) {
	return computed(() =>
		mapO((entry: NonEmptyArray<any>) =>
			entry.map((val: any, index) =>
				toEntries(
					schema.item,
					request.item,
					path.concat(['some', index]) as N.Path,
					uniqueNodes,
					deps,
					variables,
					val
				)
			)
		)(cache.value)
	)
}

function toEntriesOptionNode(
	schema: N.OptionNode<any>,
	request: N.OptionNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Ref<Option<any>>
) {
	return computed(() =>
		mapO((entry) => toEntries(schema.item, request.item, snoc(path, 'some'), uniqueNodes, deps, variables, entry))(
			cache.value
		)
	)
}

function toEntriesSumNode(
	schema: N.SumNode<any>,
	request: N.SumNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Ref<Option<[string, any]>>
) {
	return computed(() =>
		isNone(cache.value)
			? none
			: toEntriesTypeNode(
					(schema.membersRecord as any)[cache.value.value[0]],
					(request.membersRecord as any)[cache.value.value[0]],
					path,
					uniqueNodes,
					deps,
					variables,
					cache.value.value[1]
			  )
	)
}

function read(
	schema: N.Node,
	request: N.Node,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: any
): Option<any> {
	if (isPrimitiveNode(schema) || !!schema?.__isEntity) {
		return cache.value
	}
	switch (request.tag) {
		case 'Type':
			return readTypeNode(schema as N.TypeNode<any, any>, request, path, uniqueNodes, deps, variables, cache)
		case 'Array':
			return readArrayNode(schema as N.ArrayNode<any>, request, path, uniqueNodes, deps, variables, cache)
		case 'NonEmptyArray':
			return readNonEmptyArrayNode(
				schema as N.NonEmptyArrayNode<any>,
				request,
				path,
				uniqueNodes,
				deps,
				variables,
				cache
			)
		case 'Option':
			return readOptionNode(schema as N.OptionNode<any>, request, path, uniqueNodes, deps, variables, cache)
		case 'Sum':
			return readSumNode(schema as N.SumNode<any>, request, path, uniqueNodes, deps, variables, cache)
		case 'Mutation':
			return none
		default:
			return cache.value
	}
}

function readTypeNode(
	schema: N.TypeNode<any, any>,
	request: N.TypeNode<any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	entry: any
): Option<any> {
	const x: any = {}
	for (const k in request.members) {
		const keyPath = snoc(path, k);
		const result = read(
			schema.members[k],
			request.members[k],
			keyPath,
			uniqueNodes,
			deps,
			variables,
			useMemberCacheEntry(
				schema.members[k],
				keyPath,
				uniqueNodes,
				variables,
				entry[k],
				newEntry => {entry[k] = newEntry},
			)
		)
		if (isNone(result)) {
			return none
		}
		x[k] = result.value
	}
	return some(x)
}

function readArrayNode(
	schema: N.ArrayNode<any>,
	request: N.ArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: any[]
) {
	const length = cache.length
	const sw = schema.item
	const rw = request.item
	const result = new Array(length)
	for (let i = 0; i < length; i++) {
		const r = read(sw, rw, snoc(path, i), uniqueNodes, deps, variables, cache[i])
		if (isNone(r)) {
			return none
		}
		result[i] = r.value
	}
	return some(result)
}

function readNonEmptyArrayNode(
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Ref<Option<NonEmptyArray<any>>>
) {
	if (isSome(cache.value)) {
		return readArrayNode(
			schema as any,
			request as any,
			snoc(path, 'some'),
			uniqueNodes,
			deps,
			variables,
			cache.value.value as any
		)
	} else {
		return none
	}
}

function readOptionNode(
	schema: N.OptionNode<any>,
	request: N.OptionNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Ref<Option<any>>
) {
	return some(pipe(
		cache.value,
		chain((entry) => read(schema.item, request.item, snoc(path, 'some'), uniqueNodes, deps, variables, entry))
	))
}

function readSumNode(
	schema: N.SumNode<any>,
	request: N.SumNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Ref<Option<[string, any]>>
) {
	return isNone(cache.value)
		? none
		: readTypeNode(
				(schema.membersRecord as any)[cache.value.value[0]],
				(request.membersRecord as any)[cache.value.value[0]],
				path,
				uniqueNodes,
				deps,
				variables,
				cache.value.value[1]
		  )
}

function write(
	data: any,
	schema: N.Node,
	request: N.Node,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: any
): Evict {
	if (!!schema?.__isEntity) {
		return writeToEntity(data, cache)
	}
	switch (request.tag) {
		case 'Scalar':
		case 'String':
		case 'Float':
		case 'Boolean':
		case 'Int':
			return writeToEntity(data, cache)
		case 'Type':
			return writeToTypeNode(
				data,
				schema as N.TypeNode<any, any>,
				request,
				path,
				uniqueNodes,
				deps,
				variables,
				cache
			)
		case 'Array':
			return writeToArrayNode(
				data,
				schema as N.ArrayNode<any>,
				request,
				path,
				uniqueNodes,
				deps,
				variables,
				cache
			)
		case 'NonEmptyArray':
			return writeToNonEmptyArrayNode(
				data,
				schema as N.NonEmptyArrayNode<any>,
				request,
				path,
				uniqueNodes,
				deps,
				variables,
				cache
			)
		case 'Option':
			return writeToOptionNode(
				data,
				schema as N.OptionNode<any>,
				request,
				path,
				uniqueNodes,
				deps,
				variables,
				cache
			)
		case 'Sum':
			return writeToSumNode(data, schema as N.SumNode<any>, request, path, uniqueNodes, deps, variables, cache)
		case 'Mutation':
			return constVoid
	}
}

function writeToEntity(data: any, cache: Ref<Option<any>>) {
	const currentValue = cache.value
	const newValue = some(data)
	cache.value = newValue

	return () => {
		if (cache.value === newValue) {
			cache.value = currentValue
		}
	}
}

function writeToTypeNode(
	data: any,
	schema: N.TypeNode<any, any>,
	request: N.TypeNode<any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	entry: any
) {
	const evictions: Evict[] = []
	for (const k in data) {
		const keyPath = snoc(path, k)
		evictions.push(
			write(
				data[k],
				schema.members[k],
				request.members[k],
				keyPath,
				uniqueNodes,
				deps,
				variables,
				useMemberCacheEntry(
					schema.members[k],
					keyPath,
					uniqueNodes,
					variables,
					entry[k],
					newEntry => {entry[k] = newEntry},
					data[k]
				)
			)
		)
	}
	return sequenceArrayIO(evictions)
}

function writeToArrayNode(
	data: any[],
	schema: N.ArrayNode<any>,
	request: N.ArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	entry: any[]
) {
	const evictions: Evict[] = []
	const newLength = data.length
	const oldLength = entry.length
	if (newLength > oldLength) {
		evictions.push(() => {
			if (entry.length === newLength) {
				entry.splice(oldLength, newLength - oldLength)
			}
		})
	} else {
		const deletedValues = entry.splice(newLength, oldLength - newLength)
		evictions.push(() => {
			if (entry.length === newLength) {
				for (let i = newLength; i < oldLength; i++) {
					entry[i] = deletedValues[i - newLength]
				}
			}
		})
	}

	data.forEach((val, index) => {
		const indexPath = snoc(path, index)
		const indexEntry = useMemberCacheEntry(
			schema.item,
			indexPath,
			uniqueNodes,
			variables,
			entry[index] ?? useCacheEntry(schema.item, indexPath, uniqueNodes, variables, data[index]),
			constVoid,
			data[index]
		)
		entry[index] = indexEntry
		evictions.push(
			write(val, schema.item, request.item, snoc(path, index), uniqueNodes, deps, variables, indexEntry)
		)
	})
	return sequenceArrayIO(evictions)
}

function writeToNonEmptyArrayNode(
	data: NonEmptyArray<any>,
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	entry: Ref<Option<NonEmptyArray<any>>>
) {
	const currentValue = entry.value
	if (isSome(currentValue)) {
		return writeToArrayNode(
			data,
			schema as any,
			request as any,
			path,
			uniqueNodes,
			deps,
			variables,
			currentValue.value
		)
	}
	const newValue = (some(shallowReactive([])) as unknown) as Some<NonEmptyArray<any>>
	writeToArrayNode(data, schema as any, request as any, path, uniqueNodes, deps, variables, newValue.value)
	entry.value = newValue
	return () => {
		if (entry.value === newValue) {
			entry.value = currentValue
		}
	}
}

function writeToOptionNode(
	data: Option<any>,
	schema: N.OptionNode<any>,
	request: N.OptionNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Ref<Option<any>>
) {
	const currentValue = cache.value
	if (isSome(data)) {
		if (isNone(currentValue)) {
			const newPath = snoc(path, 'some')
			cache.value = some(useCacheEntry(schema.item, newPath, uniqueNodes, variables, data))
			write(
				data.value,
				schema.item,
				request.item,
				newPath,
				uniqueNodes,
				deps,
				variables,
				(cache as any).value.value
			)
			return () => {
				cache.value = currentValue
			}
		}
		const newPath = snoc(path, 'some')
		return write(
			data.value,
			schema.item,
			request.item,
			newPath,
			uniqueNodes,
			deps,
			variables,
			useMemberCacheEntry(
				schema.item,
				newPath,
				uniqueNodes,
				variables,
				currentValue.value.value,
				(newEntry) => { cache.value = some(newEntry) },
				data.value
			)
		)
	} else {
		cache.value = none
		return () => {
			cache.value = currentValue
		}
	}
}

function writeToSumNode(
	data: any,
	schema: N.SumNode<any>,
	request: N.SumNode<any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Ref<Option<[string, any]>>
) {
	if (
		(isNone(cache.value) && data.__typename) ||
		(isSome(cache.value) && data.__typename && cache.value.value[0] !== data.__typename)
	) {
		const currentValue = cache.value
		const __typename = data.__typename as string
		const newNode = useTypeNodeCacheEntry(
			(schema.membersRecord as any)[__typename],
			path,
			uniqueNodes,
			variables,
			data
		)
		cache.value = some([__typename, newNode])
		writeToTypeNode(
			data,
			(schema.membersRecord as any)[__typename],
			(request.membersRecord as any)[__typename],
			path,
			uniqueNodes,
			deps,
			variables,
			newNode
		)
		return () => {
			if (isSome(cache.value) && cache.value.value[0] === __typename && cache.value.value[1] === newNode) {
				cache.value = currentValue
			}
		}
	}
	if (isSome(cache.value) && (data.__typename === undefined || data.__typename === cache.value.value[0])) {
		const __typename = cache.value.value[0]
		return writeToTypeNode(
			data,
			(schema.membersRecord as any)[__typename],
			(request.membersRecord as any)[__typename],
			path,
			uniqueNodes,
			deps,
			variables,
			cache.value.value[1]
		)
	}
	return absurd as Evict
}

function useMemberCacheEntry(
	schema: N.Node,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, any>,
	currentEntry: any,
	updateEntry: (newEntry: any) => void,
	data?: any
) {
	if ((schema.tag === 'Type') && schema.__customCache !== undefined) {
		// @ts-ignore
		const id = schema.__customCache.toId(path, variables, data) as string
		if (id) {
			const memberCustomCache = useCustomCache(uniqueNodes, schema, path, id, variables, data)
			if (memberCustomCache !== currentEntry) {
				updateEntry(memberCustomCache)
				return memberCustomCache
			}
		}
		return currentEntry
	}
	if (isEmptyObject(schema.variables)) {
		return currentEntry
	}
	const encodedVariables = encode(schema, variables)
	let memberCache = currentEntry.get(encodedVariables)
	if (!memberCache) {
		memberCache = useCacheEntry(schema, path, uniqueNodes, variables)
		currentEntry.set(encodedVariables, memberCache)
	}
	return memberCache
}

function useCustomCache(
	uniqueNodes: Map<string, any>,
	member: N.Node,
	path: N.Path,
	id: string,
	variables: Record<string, unknown>,
	data?: any
) {
	const entry = uniqueNodes.get(id)
	if (entry) {
		return entry
	} else {
		const newEntry = useCacheEntry(member, path, uniqueNodes, variables, data)
		uniqueNodes.set(id, newEntry)
		return newEntry
	}
}

function useTypeNodeCacheEntry(
	schema: N.TypeNode<any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, unknown>,
	data?: any
) {
	const x: any = {}
	for (const k in schema.members) {
		const member: N.Node = schema.members[k]
		const newPath = snoc(path, k)
		if ((member.tag === 'Type') && member.__customCache !== undefined) {
			// @ts-ignore
			const id = member.__customCache.toId(newPath, variables, data) as string
			if (id) {
				x[k] = useCustomCache(uniqueNodes, member, newPath, id, variables, data)
			} else {
				x[k] = useCacheEntry(member, newPath, uniqueNodes, variables, data)
			}
		} else if (!isEmptyObject(member.variables)) {
			x[k] = new Map()
		} else {
			x[k] = useCacheEntry(member, newPath, uniqueNodes, variables, data)
		}
	}
	return shallowReactive(x)
}

const ENCODERS = new WeakMap<N.Node, any>()

function useEncoder(node: N.Node) {
	let encoder = ENCODERS.get(node)
	if (encoder) {
		return encoder
	}
	encoder = N.useMergedVariablesModel(node)
	ENCODERS.set(node, encoder)
	return encoder
}

function encode(node: N.Node, data: any): string {
	try {
		return JSON.stringify(useEncoder(node).encode(data))
	} catch {
		return 'unknown'
	}
}

function useCacheEntry<T extends N.Node>(
	node: T,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, unknown>,
	data?: any
): N.TypeOfCacheEntry<T> {
	if (isPrimitiveNode(node) || !!node.__isEntity) {
		return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
	switch (node.tag) {
		case 'Type':
			return useTypeNodeCacheEntry(node as any, path, uniqueNodes, variables, data) as N.TypeOfCacheEntry<T>
		case 'Array':
			return shallowReactive([]) as N.TypeOfCacheEntry<T>
		case 'Mutation':
			return useCacheEntry((node as any).result, path, uniqueNodes, variables, data) as N.TypeOfCacheEntry<T>
		default:
			return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
}
