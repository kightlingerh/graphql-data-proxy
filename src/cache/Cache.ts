import { Ref, shallowReactive, shallowRef } from '@vue/reactivity'
import { isNonEmpty, makeBy, sequence } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import { constant, constVoid, pipe } from 'fp-ts/lib/function'
import { getWitherable, map } from 'fp-ts/lib/Map'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { chain, isNone, isSome, none, option, Option, Some, some } from 'fp-ts/lib/Option'
import { fromCompare } from 'fp-ts/lib/Ord'
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
}

export function make(_: CacheDependencies) {
	return <S extends N.SchemaNode<any, any>>(schema: S) => {
		const cache = {}
		return <R extends N.SchemaNode<any, any>>(request: R) => {
			const errors = validate(schema, request)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				return right<CacheError, Cache<R>>({
					read: (variables) => read(schema, request, variables, cache),
					write: (variables) => (data) => write(data, schema, request, variables, cache)
				})
			}
		}
	}
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
			if (entry[k] === undefined) {
				entry[k] = isEmptyObject(schema.members[k].__variables_definition__)
					? makeCacheEntry(schema.members[k], request.members[k], variables)
					: shallowReactive(new Map())
			}
			let memberCache
			if (isEmptyObject(schema.members[k].__variables_definition__)) {
				memberCache = entry[k]
			} else {
				const key = encode(request, variables)
				memberCache = entry[k].get(key)
				if (!memberCache) {
					memberCache = makeCacheEntry(schema.members[k], request.members[k], variables)
					entry[k].set(key, memberCache)
				}
			}

			const result = read(schema.members[k], request.members[k], variables, memberCache)()
			if (isNone(result)) {
				return none
			}
			x[k] = result.value
		}
		return some(x)
	}
}

const arraySequenceOption = sequence(option)

function readArrayNode(schema: N.ArrayNode<any>, request: N.ArrayNode<any>, variables: object, cache: Ref<any[]>) {
	return () => {
		return arraySequenceOption(cache.value.map((val) => read(schema.wrapped, request.wrapped, variables, val)()))
	}
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
				arraySequenceOption(entry.map((val: any) => read(schema.wrapped, request.wrapped, variables, val)()))
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

const mapSequenceOption = getWitherable(fromCompare(constant(0 as const))).sequence(option)

function readMapNode(
	schema: N.MapNode<any, any>,
	request: N.MapNode<any, any>,
	variables: object,
	cache: Ref<Map<any, any>>
) {
	return () => {
		return pipe(
			cache.value,
			map((val) => read(schema.wrapped, request.wrapped, variables, val)()),
			mapSequenceOption
		)
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
			if (entry[k] === undefined) {
				if (schema.members[k] === undefined) {
					console.log(k, entry, schema.members)
				}
				entry[k] = isEmptyObject(schema.members[k].__variables_definition__)
					? makeCacheEntry(schema.members[k], request.members[k], variables, data[k])
					: shallowReactive(new Map())
			}
			let memberCache
			if (isEmptyObject(schema.members[k].__variables_definition__)) {
				memberCache = entry[k]
			} else {
				const key = encode(request, variables)
				memberCache = entry[k].get(key)
				if (!memberCache) {
					memberCache = makeCacheEntry(schema.members[k], request.members[k], variables, data[k])
					entry[k].set(key, memberCache)
				}
			}

			evict = concatEvict(evict, write(data[k], schema.members[k], request.members[k], variables, memberCache)())
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
		const newValue = makeBy(data.length, (i) => makeCacheEntry(schema.wrapped, request.wrapped, variables, data[i]))
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
			makeBy(data.length, (i) => makeCacheEntry(schema.wrapped, request.wrapped, variables, data[i]))
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
				cache.value = some(makeCacheEntry(schema.wrapped, request.wrapped, variables, data))
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
				if (v) {
					evict = concatEvict(
						evict,
						write(v, schema.wrapped, request.wrapped, variables, cacheValue.get(k))()
					)
				} else {
					const currentValue = cacheValue.get(k)
					cacheValue.delete(k)
					evict = concatEvict(evict, () => {
						if (!cacheValue.has(k)) {
							cacheValue.set(k, currentValue)
						}
					})
				}
			} else {
				const newCacheEntry = makeCacheEntry(schema.wrapped, request.wrapped, variables, v)
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
		if (isNone(cache.value) || cache.value.value[0] !== data.__typename) {
			cache.value = some([
				data.__typename,
				makeCacheEntry(
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
				(cache as any).value.value
			)()
		} else {
			return constVoid
		}
	}
}

function makeCacheEntry(schemaNode: N.Node, requestNode: N.Node, variables: object, data?: any) {
	if (!!schemaNode?.__cache__?.useCustomCache) {
		return schemaNode.__cache__.useCustomCache(schemaNode, requestNode, variables, data)
	} else {
		return defaultCacheEntry(schemaNode)
	}
}

function encode(node: N.Node, data: any): string {
	try {
		return JSON.stringify(node.variablesModel.encode(data))
	} catch {
		return 'unknown'
	}
}

function defaultCacheEntry<T extends N.Node>(node: T): N.TypeOfCacheEntry<T> {
	if (isEntityNode(node)) {
		return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
	switch (node.tag) {
		case 'Type':
			return {} as N.TypeOfCacheEntry<T>
		case 'Array':
			return shallowRef([]) as N.TypeOfCacheEntry<T>
		case 'NonEmptyArray':
		case 'Sum':
		case 'Option':
			return shallowRef(none) as N.TypeOfCacheEntry<T>
		case 'Map':
			return shallowRef(shallowReactive(new Map())) as N.TypeOfCacheEntry<T>
		case 'Mutation':
			return defaultCacheEntry((node as any).result) as N.TypeOfCacheEntry<T>
		default:
			return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
}
