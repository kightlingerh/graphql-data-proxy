import { isNonEmpty, makeBy, snoc } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import { constVoid, Endomorphism, pipe } from 'fp-ts/lib/function'
import { IO, sequenceArray as sequenceArrayIO } from 'fp-ts/lib/IO'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { chain, isNone, isSome, none, Option, some, map as mapO, Some } from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { Tree } from 'fp-ts/lib/Tree'
import { computed, shallowReactive, shallowRef } from 'vue'
import * as N from '../node'
import { Ref } from '../node'
import { isDev, isEmptyObject } from '../shared'
import { isNonPrimitiveEntityNode, isPrimitiveNode, traverseMapWithKey } from './shared'
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

export function make(_: CacheDependencies) {
	return <S extends N.SchemaNode<any, any>>(schema: S) => {
		const cache: object = Object.create(null)
		const uniqueNodes = new Map<string, any>()
		return <R extends N.SchemaNode<any, any>>(request: R) => {
			const errors = validate(schema, request)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				return right<CacheError, Cache<R>>({
					read: (variables) => () => read(schema, request, variables, cache),
					write: (variables) => (data) => () => write(data, schema, request, variables, cache),
					toEntries: (variables) => () => toEntries(schema, request, variables, cache)
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
	variables: object,
	cache: any
): any {
	if (isPrimitiveNode(schema)) {
		return cache
	}
	if (isNonPrimitiveEntityNode(request)) {
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
		case 'Map':
			return toEntriesMapNode(
				schema as N.MapNode<any, any, any, any, any, any>,
				request,
				path,
				uniqueNodes,
				deps,
				variables,
				cache
			)
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
	variables: object,
	entry: any
) {
	return () => {
		const x: any = Object.create(null)
		for (const k in request.members) {
			x[k] = toEntries(
				schema.members[k],
				request.members[k],
				snoc(path, k),
				uniqueNodes,
				deps,
				variables,
				getTypeNodeMemberCacheEntry(k, schema, request, variables, entry)
			)
		}
		return x
	}
}

function toEntriesArrayNode(
	schema: N.ArrayNode<any>,
	request: N.ArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
	cache: any[]
) {
	return computed(() =>
		cache.map((val, i) => toEntries(schema.item, request.item, snoc(path, i), uniqueNodes, deps, variables, val))
	)
}

function toEntriesNonEmptyArrayNode(
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
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
	variables: object,
	cache: Ref<Option<any>>
) {
	return computed(() =>
		mapO((entry) => toEntries(schema.item, request.item, snoc(path, 'some'), uniqueNodes, deps, variables, entry))(
			cache.value
		)
	)
}

function toEntriesMapNode(
	schema: N.MapNode<any, any, any, any, any, any>,
	request: N.MapNode<any, any, any, any, any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
	cache: Map<any, any>
) {
	return computed(() =>
		traverseMapWithKey((key: string, val) =>
			toEntries(schema.item, request.item, snoc(path, key), uniqueNodes, deps, variables, val)
		)(cache)
	)
}

function toEntriesSumNode(
	schema: N.SumNode<any>,
	request: N.SumNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
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
	variables: object,
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
		case 'Map':
			return readMapNode(
				schema as N.MapNode<any, any, any, any, any, any>,
				request,
				path,
				uniqueNodes,
				variables,
				deps,
				cache
			)
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
	variables: object,
	entry: any
): Option<any> {
	const x: any = {}
	for (const k in request.members) {
		const result = read(
			schema.members[k],
			request.members[k],
			snoc(path, k),
			uniqueNodes,
			deps,
			variables,
			getTypeNodeMemberCacheEntry(k, schema, request, variables, entry)
		)
		if (isNone(result)) {
			return none
		}
		x[k] = result.value
	}
	return some(x)
}

function getTypeNodeMemberCacheEntry(
	member: string,
	schema: N.TypeNode<any, any>,
	request: N.TypeNode<any, any>,
	variables: object,
	entry: any,
	data?: any
) {
	if (entry[member] === undefined) {
		entry[member] = isEmptyObject(schema.members[member].__variables_definition__)
			? useStaticCacheEntry(schema.members[member], request.members[member], variables, data && data[member])
			: new Map()
	}
	let memberCache
	if (isEmptyObject(schema.members[member].__variables_definition__)) {
		memberCache = entry[member]
	} else {
		const encodedVariables = encode(schema.members[member], variables)
		memberCache = entry[member].get(encodedVariables)
		if (!memberCache) {
			memberCache = useStaticCacheEntry(
				schema.members[member],
				request.members[member],
				variables,
				data && data[member]
			)
			entry[member].set(encodedVariables, memberCache)
		}
	}
	return memberCache
}

function readArrayNode(
	schema: N.ArrayNode<any>,
	request: N.ArrayNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
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
	variables: object,
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
			cache.value as any
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
	variables: object,
	cache: Ref<Option<any>>
) {
	return some(
		pipe(
			cache.value,
			chain((entry) => read(schema.item, request.item, snoc(path, 'some'), uniqueNodes, deps, variables, entry))
		)
	)
}

function readMapNode(
	schema: N.MapNode<any, any, any, any, any, any>,
	request: N.MapNode<any, any, any, any, any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
	cache: Map<any, any>
) {
	if (cache.size === 0) {
		return some(cache)
	} else {
		const result = new Map()
		const sw = schema.item
		const rw = request.item
		for (const [key, value] of cache.entries()) {
			const r = read(sw, rw, snoc(path, key), uniqueNodes, deps, variables, value)
			if (isNone(r)) {
				return none
			}
			result.set(key, r.value)
		}
		return some(result)
	}
}

function readSumNode(
	schema: N.SumNode<any>,
	request: N.SumNode<any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
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
	variables: object,
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
		case 'Map':
			return writeToMapNode(
				data,
				schema as N.MapNode<any, any, any, any, any, any>,
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
	variables: object,
	entry: any
) {
	const evictions: Evict[] = []
	for (const k in data) {
		evictions.push(
			write(
				data[k],
				schema.members[k],
				request.members[k],
				snoc(path, k),
				uniqueNodes,
				deps,
				variables,
				getTypeNodeMemberCacheEntry(k, schema, request, variables, entry, data)
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
	variables: object,
	entry: any[]
) {
	const evictions: Evict[] = []
	const newLength = data.length;
	const oldLength = entry.length;
	if (newLength > oldLength) {
		evictions.push(() => {
			if (entry.length === newLength) {
				entry.splice(oldLength, newLength - oldLength)
			}
		})
	} else {
		const deletedValues = entry.splice(newLength, oldLength - newLength);
		evictions.push(() => {
			if (entry.length === newLength) {
				for (let i = newLength; i < oldLength; i++) {
					entry[i] = deletedValues[i - newLength];
				}
			}
		})
	}

	data.forEach((val, index) => {
		evictions.push(write(val, schema.item, request.item, snoc(path, index), uniqueNodes, deps, variables, entry[index] ?? useStaticCacheEntry(schema.item, request.item, variables, data[index])))
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
	variables: object,
	entry: Ref<Option<NonEmptyArray<any>>>
) {
	const currentValue = entry.value
	if (isSome(currentValue)) {
		return writeToArrayNode(data, schema as any, request as any, path, uniqueNodes, deps, variables, currentValue.value)
	}
	const newValue = some(shallowReactive([])) as unknown as Some<NonEmptyArray<any>>;
	write(data, schema as any, request as any, path, uniqueNodes, deps, variables, newValue.value);
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
	variables: object,
	cache: Ref<Option<any>>
) {
	const currentValue = cache.value
	if (isSome(data)) {
		if (isNone(currentValue)) {
			cache.value = some(useStaticCacheEntry(schema.item, request.item, variables, data))
			write(
				data.value,
				schema.item,
				request.item,
				snoc(path, 'some'),
				uniqueNodes,
				deps,
				variables,
				(cache as any).value.value
			)
			return () => {
				cache.value = currentValue
			}
		}
		return write(
			data.value,
			schema.item,
			request.item,
			snoc(path, 'some'),
			uniqueNodes,
			deps,
			variables,
			(cache as any).value.value
		)
	} else {
		cache.value = none
		return () => {
			cache.value = currentValue
		}
	}
}

function writeToMapNode(
	data: Map<any, any>,
	schema: N.MapNode<any, any, any, any, any, any>,
	request: N.MapNode<any, any, any, any, any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
	cache: Map<any, any>
) {
	const evictions: Evict[] = []
	for (const [k, v] of data.entries()) {
		if (cache.has(k)) {
			if (v === null || v === undefined) {
				const currentValue = cache.get(k)
				cache.delete(k)
				evictions.push(() => {
					if (!cache.has(k)) {
						cache.set(k, currentValue)
					}
				})
			} else {
				evictions.push(
					write(v, schema.item, request.item, snoc(path, k), uniqueNodes, deps, variables, cache.get(k))
				)
			}
		} else {
			const newCacheEntry = useStaticCacheEntry(schema.item, request.item, variables, v)
			cache.set(k, newCacheEntry)
			write(v, schema.item, request.item, snoc(path, k), uniqueNodes, deps, variables, newCacheEntry)
			evictions.push(() => cache.delete(k))
		}
	}
	return sequenceArrayIO(evictions)
}

function writeToSumNode(
	data: any,
	schema: N.SumNode<any>,
	request: N.SumNode<any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: object,
	cache: Ref<Option<[string, any]>>
) {
	if (isNone(cache.value) || (data.__typename && cache.value.value[0] !== data.__typename)) {
		cache.value = some([
			data.__typename,
			useStaticCacheEntry(
				(schema.membersRecord as any)[data.__typename],
				(request.membersRecord as any)[data.__typename],
				variables,
				data
			)
		] as any)
	}
	const __typename = data.__typename || (cache as any).value.value[0]
	if (!!__typename) {
		return writeToTypeNode(
			data,
			(schema.membersRecord as any)[__typename],
			(request.membersRecord as any)[__typename],
			path,
			uniqueNodes,
			deps,
			variables,
			(cache as any).value.value[1]
		)
	} else {
		return constVoid
	}
}

function useStaticCacheEntry(schemaNode: N.Node, requestNode: N.Node, variables: object, data?: any) {
	if (!!schemaNode?.__cache__?.useCustomCache) {
		const customCacheEntry = schemaNode.__cache__.useCustomCache(schemaNode, requestNode, variables, data)
		return isSome(customCacheEntry) ? customCacheEntry.value : useDefaultCacheEntry(schemaNode)
	} else {
		return useDefaultCacheEntry(schemaNode)
	}
}

function encode(node: N.Node, data: any): string {
	try {
		return JSON.stringify(node.variablesModel.encode(data))
	} catch {
		return 'unknown'
	}
}

function useDefaultCacheEntry<T extends N.Node>(node: T): N.TypeOfCacheEntry<T> {
	if (isEntityNode(node)) {
		return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
	switch (node.tag) {
		case 'Type':
			return Object.create(null) as N.TypeOfCacheEntry<T>
		case 'Array':
			return shallowReactive([]) as N.TypeOfCacheEntry<T>
		case 'Map':
			return shallowReactive(new Map()) as N.TypeOfCacheEntry<T>
		case 'Mutation':
			return useDefaultCacheEntry((node as any).result) as N.TypeOfCacheEntry<T>
		default:
			return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
}
