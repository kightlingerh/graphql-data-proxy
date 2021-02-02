import { isNonEmpty, snoc } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import { absurd, constVoid, Endomorphism, pipe } from 'fp-ts/lib/function'
import { IO, sequenceArray as sequenceArrayIO } from 'fp-ts/lib/IO'
import { NonEmptyArray, of } from 'fp-ts/lib/NonEmptyArray'
import { isNone, isSome, none, Option, some, map as mapO, Some } from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { Tree } from 'fp-ts/lib/Tree'
import { computed, shallowReactive, shallowRef } from 'vue'
import * as N from '../node'
import { Ref } from '../node'
import { isEmptyObject } from '../shared'
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
	variables: Record<string, unknown>,
	entry: any
) {
	const x: any = {}
	for (const k in request.members) {
		const memberPath = snoc(path, k)
		x[k] = toEntries(
			schema.members[k],
			request.members[k],
			memberPath,
			uniqueNodes,
			deps,
			variables,
			useTypeNodeMemberCacheEntry(k, schema, memberPath, uniqueNodes, variables, entry)
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

function toEntriesMapNode(
	schema: N.MapNode<any, any, any, any, any, any>,
	request: N.MapNode<any, any, any, any, any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Map<any, any>
) {
	return traverseMapWithKey((key: string, val) =>
		toEntries(schema.item, request.item, snoc(path, key), uniqueNodes, deps, variables, val)
	)(cache)
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
		case 'Map':
			return readMapNode(
				schema as N.MapNode<any, any, any, any, any, any>,
				request,
				path,
				uniqueNodes,
				deps,
				variables,
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
	variables: Record<string, unknown>,
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
			useTypeNodeMemberCacheEntry(k, schema, snoc(path, k), uniqueNodes, variables, entry)
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
	return pipe(
		cache.value,
		mapO((entry) => read(schema.item, request.item, snoc(path, 'some'), uniqueNodes, deps, variables, entry))
	)
}

function readMapNode(
	schema: N.MapNode<any, any, any, any, any, any>,
	request: N.MapNode<any, any, any, any, any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	deps: CacheDependencies,
	variables: Record<string, unknown>,
	cache: Map<any, any>
) {
	if (cache.size === 0) {
		return some(new Map())
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
				useTypeNodeMemberCacheEntry(k, schema, keyPath, uniqueNodes, variables, entry, data[k])
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
		let indexEntry = entry[index]
		if (!indexEntry) {
			indexEntry = useCacheEntry(schema.item, snoc(path, index), uniqueNodes, variables, data[index])
			entry[index] = indexEntry
		}
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
			cache.value = some(useCacheEntry(schema.item, path, uniqueNodes, variables, data))
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
	variables: Record<string, unknown>,
	cache: Map<any, any>
) {
	const evictions: Evict[] = []
	for (const [k, v] of data.entries()) {
		const keyPath = snoc(path, k);
		if (cache.has(k)) {
			if (v === null || v === undefined) {
				const currentValue = useMapNodeKeyCacheEntry(k, schema, keyPath, uniqueNodes, variables, cache, data.get(k))
				cache.delete(k)
				evictions.push(() => {
					if (!cache.has(k)) {
						cache.set(k, currentValue)
					}
				})
			} else {
				evictions.push(
					write(v, schema.item, request.item, keyPath, uniqueNodes, deps, variables, useMapNodeKeyCacheEntry(k, schema, keyPath, uniqueNodes, variables, cache, data.get(k)))
				)
			}
		} else {
			const newCacheEntry = useMapNodeKeyCacheEntry(k, schema, keyPath, uniqueNodes, variables, cache, data.get(k))
			cache.set(k, newCacheEntry)
			write(v, schema.item, request.item, keyPath, uniqueNodes, deps, variables, newCacheEntry)
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

function useMapNodeKeyCacheEntry(
	key: string,
	schema: N.MapNode<any, any, any, any, any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, unknown>,
	entry: Map<any, any>,
	data?: any
) {
	const itemNode: N.Node = schema.item;
	if ((itemNode.tag === 'Map' || itemNode.tag === 'Type') && itemNode.__customCache !== undefined) {
		// @ts-ignore
		const id = itemNode.__customCache.toId(path, variables, data)
		if (id) {
			const memberCustomCache = useCustomCache(uniqueNodes, itemNode, path, id, variables, data)
			if (memberCustomCache !== entry.get(key)) {
				entry.set(key, memberCustomCache)
			}
			return memberCustomCache;
		}
	}
	let keyEntry = entry.get(key);
	if (!keyEntry) {
		keyEntry = useCacheEntry(itemNode, path, uniqueNodes, variables, data);
		entry.set(key, keyEntry);
	}
	return keyEntry;
}


function useTypeNodeMemberCacheEntry(
	member: string,
	schema: N.TypeNode<any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, unknown>,
	entry: any,
	data?: any
) {
	const memberNode: N.Node = schema.members[member]
	if ((memberNode.tag === 'Map' || memberNode.tag === 'Type') && memberNode.__customCache !== undefined) {
		// @ts-ignore
		const id = memberNode.__customCache.toId(path, variables, data)
		if (id) {
			const memberCustomCache = useCustomCache(uniqueNodes, memberNode, path, id, variables, data)
			if (memberCustomCache !== entry[member]) {
				entry[member] = memberCustomCache
			}
		}
		return entry[member]
	}
	if (isEmptyObject(memberNode.variables)) {
		return entry[member]
	}
	const encodedVariables = encode(schema.members[member], variables)
	let memberCache = entry[member].get(encodedVariables)
	if (!memberCache) {
		memberCache = useCacheEntry(schema.members[member], path, uniqueNodes, variables)
		entry[member].set(encodedVariables, memberCache)
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
		if ((member.tag === 'Map' || member.tag === 'Type') && member.__customCache !== undefined) {
			// @ts-ignore
			const id = member.__customCache.toId(newPath, variables, data)
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

function useMapNodeCacheEntry(
	schema: N.MapNode<any, any, any, any, any, any>,
	path: N.Path,
	uniqueNodes: Map<string, any>,
	variables: Record<string, unknown>,
	data?: any
) {
	if (schema.__customCache) {
		const id = schema.__customCache.toId(path, variables, data) as string
		if (id) {
			const entry = uniqueNodes.get(id)
			if (entry) {
				return entry
			} else {
				const newEntry = shallowReactive(new Map())
				uniqueNodes.set(id, newEntry)
				return newEntry
			}
		}
	}
	return shallowReactive(new Map())
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
		case 'Map':
			return useMapNodeCacheEntry(node as any, path, uniqueNodes, variables, data)
		case 'Mutation':
			return useCacheEntry((node as any).result, path, uniqueNodes, variables, data) as N.TypeOfCacheEntry<T>
		default:
			return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
}
