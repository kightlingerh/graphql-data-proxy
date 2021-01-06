import { computed, Ref, shallowReactive, shallowRef } from 'vue'
import { isNonEmpty, makeBy, traverse } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import { constant, constVoid, pipe } from 'fp-ts/lib/function'
import { map } from 'fp-ts/lib/Map'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { chain, isNone, isSome, none, option, Option, Some, some, map as mapO } from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import * as N from '../node/Node'
import {
	CacheError,
	CacheResult,
	CacheWriteResult,
	cacheWriteResultMonoid,
	concatEvict,
	isEmptyObject,
	Persist
} from '../shared'
import { isEntityNode } from './shared'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	persist?: Persist
}

export interface Cache<R> {
	write(variables: N.TypeOfMergedVariables<R>): Reader<N.TypeOfPartial<R>, CacheWriteResult>
	read(variables: N.TypeOfMergedVariables<R>): CacheResult<Option<N.TypeOf<R>>>
	toRefs(variables: N.TypeOfMergedVariables<R>): CacheResult<N.TypeOfRefs<R>>
}

export function make(_: CacheDependencies) {
	return <S extends N.SchemaNode<any, any>>(schema: S) => {
		const cache: object = Object.create(null)
		console.log(cache)
		return <R extends N.SchemaNode<any, any>>(request: R) => {
			const errors = validate(schema, request)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				return right<CacheError, Cache<R>>({
					read: (variables) => read(schema, request, variables, cache),
					write: (variables) => (data) => write(data, schema, request, variables, cache),
					toRefs: (variables) => toRefs(schema, request, variables, cache)
				})
			}
		}
	}
}

function toRefs(schema: N.Node, request: N.Node, variables: object, cache: any): CacheResult<any> {
	if (isEntityNode(schema)) {
		return () => cache
	}
	if (isEntityNode(request)) {
		return () => computed(read(schema, request, variables, cache))
	}
	switch (request.tag) {
		case 'Type':
			return toRefsTypeNode(schema as N.TypeNode<any, any>, request, variables, cache)
		case 'Array':
			return toRefsArrayNode(schema as N.ArrayNode<any>, request, variables, cache)
		case 'NonEmptyArray':
			return toRefsNonEmptyArrayNode(schema as N.NonEmptyArrayNode<any>, request, variables, cache)
		case 'Option':
			return toRefsOptionNode(schema as N.OptionNode<any>, request, variables, cache)
		case 'Map':
			return toRefsMapNode(schema as N.MapNode<any, any>, request, variables, cache)
		case 'Sum':
			return toRefsSumNode(schema as N.SumNode<any>, request, variables, cache)
		default:
			return cache
	}
}

function toRefsTypeNode(
	schema: N.TypeNode<any, any>,
	request: N.TypeNode<any, any>,
	variables: object,
	entry: any
): CacheResult<any> {
	return () => {
		const x: any = {}
		for (const k in request.members) {
			x[k] = toRefs(
				schema.members[k],
				request.members[k],
				variables,
				getTypeNodeMemberCacheEntry(k, schema, request, variables, entry)
			)()
		}
		return x
	}
}

function toRefsArrayNode(schema: N.ArrayNode<any>, request: N.ArrayNode<any>, variables: object, cache: Ref<any[]>) {
	return () => {
		return computed(() => cache.value.map((val) => toRefs(schema.wrapped, request.wrapped, variables, val)()))
	}
}

function toRefsNonEmptyArrayNode(
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	variables: object,
	cache: Ref<Option<NonEmptyArray<any>>>
) {
	return () => {
		return computed(() =>
			pipe(
				cache.value,
				mapO((entry) => entry.map((val: any) => toRefs(schema.wrapped, request.wrapped, variables, val)()))
			)
		)
	}
}

function toRefsOptionNode(
	schema: N.OptionNode<any>,
	request: N.OptionNode<any>,
	variables: object,
	cache: Ref<Option<any>>
) {
	return () => {
		return computed(() =>
			pipe(
				cache.value,
				mapO((entry) => toRefs(schema.wrapped, request.wrapped, variables, entry)())
			)
		)
	}
}

function toRefsMapNode(
	schema: N.MapNode<any, any>,
	request: N.MapNode<any, any>,
	variables: object,
	cache: Ref<Map<any, any>>
) {
	return () => {
		return computed(() =>
			pipe(
				cache.value,
				map((val) => toRefs(schema.wrapped, request.wrapped, variables, val)())
			)
		)
	}
}

function toRefsSumNode(
	schema: N.SumNode<any>,
	request: N.SumNode<any>,
	variables: object,
	cache: Ref<Option<[string, any]>>
) {
	return () =>
		computed(() =>
			isNone(cache.value)
				? none
				: readTypeNode(
						schema.membersRecord[cache.value.value[0]],
						request.membersRecord[cache.value.value[0]],
						variables,
						cache.value.value[1]
				  )()
		)
}

function read(schema: N.Node, request: N.Node, variables: object, cache: any): CacheResult<Option<any>> {
	if (isEntityNode(schema)) {
		return readEntity(cache)
	}
	switch (request.tag) {
		case 'Type':
			return readTypeNode(schema as N.TypeNode<any, any>, request, variables, cache)
		case 'Array':
			return readArrayNode(schema as N.ArrayNode<any>, request, variables, cache)
		case 'NonEmptyArray':
			return readNonEmptyArrayNode(schema as N.NonEmptyArrayNode<any>, request, variables, cache)
		case 'Option':
			return readOptionNode(schema as N.OptionNode<any>, request, variables, cache)
		case 'Map':
			return readMapNode(schema as N.MapNode<any, any>, request, variables, cache)
		case 'Sum':
			return readSumNode(schema as N.SumNode<any>, request, variables, cache)
		case 'Mutation':
			return constant(none)
		default:
			return readEntity(cache)
	}
}

function readEntity(cache: Ref<Option<any>>) {
	return () => cache.value
}

function readTypeNode(
	schema: N.TypeNode<any, any>,
	request: N.TypeNode<any, any>,
	variables: object,
	entry: any
): CacheResult<Option<any>> {
	return () => {
		const x: any = {}
		for (const k in request.members) {
			const result = read(
				schema.members[k],
				request.members[k],
				variables,
				getTypeNodeMemberCacheEntry(k, schema, request, variables, entry)
			)()
			if (isNone(result)) {
				return none
			}
			x[k] = result.value
		}
		return some(x)
	}
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

const arrayTraverseOption = traverse(option)

function readArrayNode(schema: N.ArrayNode<any>, request: N.ArrayNode<any>, variables: object, cache: Ref<any[]>) {
	return () => arrayTraverseOption((val) => read(schema.wrapped, request.wrapped, variables, val)())(cache.value)
}

function readNonEmptyArrayNode(
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	variables: object,
	cache: Ref<Option<NonEmptyArray<any>>>
) {
	return () => {
		return pipe(
			cache.value,
			chain((entry) =>
				arrayTraverseOption((val: any) => read(schema.wrapped, request.wrapped, variables, val)())(entry)
			)
		)
	}
}

function readOptionNode(
	schema: N.OptionNode<any>,
	request: N.OptionNode<any>,
	variables: object,
	cache: Ref<Option<any>>
) {
	return () => {
		return some(
			pipe(
				cache.value,
				chain((entry) => read(schema.wrapped, request.wrapped, variables, entry)())
			)
		)
	}
}

function readMapNode(
	schema: N.MapNode<any, any>,
	request: N.MapNode<any, any>,
	variables: object,
	cache: Ref<Map<any, any>>
) {
	return () => {
		const v = cache.value
		if (v.size === 0) {
			return some(v)
		} else {
			const result = new Map()
			const sw = schema.wrapped
			const rw = request.wrapped
			for (const [key, value] of v.entries()) {
				const r = read(sw, rw, variables, value)()
				if (isSome(r)) {
					result.set(key, r.value)
				} else {
					return none
				}
			}
			return some(result)
		}
	}
}

function readSumNode(
	schema: N.SumNode<any>,
	request: N.SumNode<any>,
	variables: object,
	cache: Ref<Option<[string, any]>>
) {
	return () =>
		isNone(cache.value)
			? none
			: readTypeNode(
					schema.membersRecord[cache.value.value[0]],
					request.membersRecord[cache.value.value[0]],
					variables,
					cache.value.value[1]
			  )()
}

function write(data: any, schema: N.Node, request: N.Node, variables: object, cache: any): CacheWriteResult {
	if (schema?.__cache__?.isEntity) {
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
			return writeToTypeNode(data, schema as N.TypeNode<any, any>, request, variables, cache)
		case 'Array':
			return writeToArrayNode(data, schema as N.ArrayNode<any>, request, variables, cache)
		case 'NonEmptyArray':
			return writeToNonEmptyArrayNode(data, schema as N.NonEmptyArrayNode<any>, request, variables, cache)
		case 'Option':
			return writeToOptionNode(data, schema as N.OptionNode<any>, request, variables, cache)
		case 'Map':
			return writeToMapNode(data, schema as N.MapNode<any, any>, request, variables, cache)
		case 'Sum':
			return writeToSumNode(data, schema as N.SumNode<any>, request, variables, cache)
		case 'Mutation':
			return cacheWriteResultMonoid.empty
	}
}

function writeToEntity(data: any, cache: Ref<Option<any>>) {
	return () => {
		const currentValue = cache.value
		const newValue = some(data)
		cache.value = newValue

		return () => {
			if (cache.value === newValue) {
				cache.value = currentValue
			}
		}
	}
}

function writeToTypeNode(
	data: any,
	schema: N.TypeNode<any, any, any, any, any, any, any, any>,
	request: N.TypeNode<any, any, any, any, any, any, any, any>,
	variables: object,
	entry: any
) {
	return () => {
		let evict = constVoid
		for (const k in data) {
			evict = concatEvict(
				evict,
				write(
					data[k],
					schema.members[k],
					request.members[k],
					variables,
					getTypeNodeMemberCacheEntry(k, schema, request, variables, entry, data)
				)()
			)
		}
		return evict
	}
}

function writeToArrayNode(
	data: any[],
	schema: N.ArrayNode<any>,
	request: N.ArrayNode<any>,
	variables: object,
	entry: Ref<any[]>
) {
	return () => {
		const currentValue = entry.value
		const newValue = makeBy(data.length, (i) =>
			useStaticCacheEntry(schema.wrapped, request.wrapped, variables, data[i])
		)
		data.forEach((val, index) => {
			write(val, schema.wrapped, request.wrapped, variables, newValue[index])()
		})
		entry.value = newValue
		return () => {
			if (entry.value === newValue) entry.value = currentValue
		}
	}
}

function writeToNonEmptyArrayNode(
	data: NonEmptyArray<any>,
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	variables: object,
	entry: Ref<Option<NonEmptyArray<any>>>
) {
	return () => {
		const currentValue = entry.value
		const newValue = some(
			makeBy(data.length, (i) => useStaticCacheEntry(schema.wrapped, request.wrapped, variables, data[i]))
		) as Some<NonEmptyArray<any>>
		data.forEach((val, index) => write(val, schema.wrapped, request.wrapped, variables, newValue.value[index])())
		entry.value = newValue
		return () => {
			if (entry.value === newValue) {
				entry.value = currentValue
			}
		}
	}
}

function writeToOptionNode(
	data: Option<any>,
	schema: N.OptionNode<any>,
	request: N.OptionNode<any>,
	variables: object,
	cache: Ref<Option<any>>
) {
	return () => {
		const currentValue = cache.value
		if (isSome(data)) {
			if (isNone(currentValue)) {
				cache.value = some(useStaticCacheEntry(schema.wrapped, request.wrapped, variables, data))
				write(data.value, schema.wrapped, request.wrapped, variables, (cache as any).value.value)()
				return () => {
					cache.value = currentValue
				}
			}
			return write(data.value, schema.wrapped, request.wrapped, variables, (cache as any).value.value)()
		} else {
			cache.value = none
			return () => {
				cache.value = currentValue
			}
		}
	}
}

function writeToMapNode(
	data: Map<any, any>,
	schema: N.MapNode<any, any>,
	request: N.MapNode<any, any>,
	variables: object,
	cache: Ref<Map<any, any>>
) {
	return () => {
		const cacheValue = cache.value
		let evict = constVoid
		for (const [k, v] of data.entries()) {
			if (cacheValue.has(k)) {
				if (v === null || v === undefined) {
					const currentValue = cacheValue.get(k)
					cacheValue.delete(k)
					evict = concatEvict(evict, () => {
						if (!cacheValue.has(k)) {
							cacheValue.set(k, currentValue)
						}
					})
				} else {
					evict = concatEvict(
						evict,
						write(v, schema.wrapped, request.wrapped, variables, cacheValue.get(k))()
					)
				}
			} else {
				const newCacheEntry = useStaticCacheEntry(schema.wrapped, request.wrapped, variables, v)
				cacheValue.set(k, newCacheEntry)
				write(v, schema.wrapped, request.wrapped, variables, newCacheEntry)()
				evict = concatEvict(evict, () => cacheValue.delete(k))
			}
		}
		return evict
	}
}

function writeToSumNode(
	data: any,
	schema: N.SumNode<any>,
	request: N.SumNode<any, any>,
	variables: object,
	cache: Ref<Option<[string, any]>>
) {
	return () => {
		if (isNone(cache.value) || (data.__typename && cache.value.value[0] !== data.__typename)) {
			cache.value = some([
				data.__typename,
				useStaticCacheEntry(
					schema.membersRecord[data.__typename],
					request.membersRecord[data.__typename],
					variables,
					data
				)
			] as any)
		}
		const __typename = data.__typename || (cache as any).value.value[0]
		if (!!__typename) {
			return writeToTypeNode(
				data,
				schema.membersRecord[__typename],
				request.membersRecord[__typename],
				variables,
				(cache as any).value.value[1]
			)()
		} else {
			return constVoid
		}
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
			return shallowRef([]) as N.TypeOfCacheEntry<T>
		case 'NonEmptyArray':
		case 'Sum':
		case 'Option':
			return shallowRef(none) as N.TypeOfCacheEntry<T>
		case 'Map':
			return shallowRef(shallowReactive(new Map())) as N.TypeOfCacheEntry<T>
		case 'Mutation':
			return useDefaultCacheEntry((node as any).result) as N.TypeOfCacheEntry<T>
		default:
			return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
}
