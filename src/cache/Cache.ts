import { shallowReactive } from '@vue/reactivity'
import { isNonEmpty, makeBy, sequence } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import { constant, constVoid, Lazy, pipe } from 'fp-ts/lib/function'
import { getWitherable, map } from 'fp-ts/lib/Map'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { chain, isNone, isSome, none, option, Option, some } from 'fp-ts/lib/Option'
import { fromCompare } from 'fp-ts/lib/Ord'
import { Reader } from 'fp-ts/lib/Reader'
import * as N from '../node/Node'
import { CacheNode } from '../node/Node'
import { CacheError, CacheResult, CacheWriteResult, cacheWriteResultMonoid, concatEvict, Persist } from '../shared'
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

export function make<S extends N.SchemaNode<any, any>>(schema: S) {
	return (_: CacheDependencies) => {
		return <R extends N.SchemaNode<any, any>>(request: R) => {
			const errors = validate(schema, request)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				const cache = new Map()
				return right<CacheError, Cache<R>>({
					read: (variables) => read(schema, request, variables, cache),
					write: (variables) => (data) => write(data, schema, request, variables, cache)
				})
			}
		}
	}
}

function read(schema: N.Node, request: N.Node, variables: object, cache: CacheNode): CacheResult<Option<any>> {
	if (isEntityNode(schema)) {
		return () => cache.get(encode(request, variables)) || none
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
			return () => cache.get(encode(request, variables)) || none
	}
}

function readTypeNode(
	schema: N.TypeNode<any, any>,
	request: N.TypeNode<any, any>,
	variables: object,
	cache: CacheNode
): CacheResult<Option<any>> {
	return () => {
		const requestCache = getCache(schema, request, variables, cache, () => shallowReactive({}))
		const x: any = {}
		for (const k in request.members) {
			if (requestCache[k] === undefined) {
				return none
			}
			const result = read(schema.members[k], request.members[k], variables, requestCache[k])()
			if (isNone(result)) {
				return none
			}
			x[k] = result.value
		}
		return some(x)
	}
}

const arraySequenceOption = sequence(option)

function readArrayNode(schema: N.ArrayNode<any>, request: N.ArrayNode<any>, variables: object, cache: CacheNode) {
	return () => {
		const cacheEntry = !!schema?.__cache__?.useCustomCache
			? schema.__cache__.useCustomCache(schema, request, variables, cache)
			: cache.get(encode(request, variables))
		if (!cacheEntry) {
			return none
		}
		return arraySequenceOption(
			cacheEntry.map((val: CacheNode) => read(schema.wrapped, request.wrapped, variables, val)())
		)
	}
}

function readNonEmptyArrayNode(
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	variables: object,
	cache: CacheNode
) {
	return () => {
		const cacheEntry = !!schema?.__cache__?.useCustomCache
			? schema.__cache__.useCustomCache(schema, request, variables, cache)
			: cache.get(encode(request, variables))
		if (!cacheEntry) {
			return none
		}
		return pipe(
			cacheEntry as Option<CacheNode[]>,
			chain((entry) =>
				arraySequenceOption(
					entry.map((val: CacheNode) => read(schema.wrapped, request.wrapped, variables, val)())
				)
			)
		)
	}
}

function readOptionNode(schema: N.OptionNode<any>, request: N.OptionNode<any>, variables: object, cache: CacheNode) {
	return () => {
		const cacheEntry = !!schema?.__cache__?.useCustomCache
			? schema.__cache__.useCustomCache(schema, request, variables, cache)
			: cache.get(encode(request, variables))
		if (!cacheEntry) {
			return some(none)
		}
		return some(
			pipe(
				cacheEntry as Option<CacheNode>,
				chain((entry) => read(schema.wrapped, request.wrapped, variables, entry)())
			)
		)
	}
}

const mapSequenceOption = getWitherable(fromCompare(constant(0 as const))).sequence(option)

function readMapNode(schema: N.MapNode<any, any>, request: N.MapNode<any, any>, variables: object, cache: CacheNode) {
	return () => {
		return pipe(
			getCache(schema, request, variables, cache, () => shallowReactive(new Map())) as Map<any, CacheNode>,
			map((val) => read(schema.wrapped, request.wrapped, variables, val)()),
			mapSequenceOption
		)
	}
}

function readSumNode(schema: N.SumNode<any>, request: N.SumNode<any>, variables: object, cache: CacheNode) {
	return () => {
		const cacheEntry = cache.get(encode(request, variables))
		if (!cacheEntry) {
			return none
		}
		return readTypeNode(
			schema.membersRecord[cacheEntry[0]],
			request.membersRecord[cacheEntry[0]],
			variables,
			cacheEntry[1]
		)()
	}
}

function write(data: any, schema: N.Node, request: N.Node, variables: object, cache: CacheNode): CacheWriteResult {
	if (schema?.__cache__?.isEntity) {
		return writeToEntity(data, request, variables, cache)
	}
	switch (request.tag) {
		case 'Scalar':
		case 'String':
		case 'Float':
		case 'Boolean':
		case 'Int':
			return writeToEntity(data, request, variables, cache)
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

function writeToEntity(data: any, request: N.Node, variables: object, cache: CacheNode) {
	return () => {
		const key = encode(request, variables)
		const currentValue = cache.get(key)
		cache.set(key, some(data))
		return () => {
			cache.set(key, currentValue ?? none)
		}
	}
}

function writeToTypeNode<T extends N.TypeNode<any, any>>(
	data: N.TypeOfPartial<T>,
	schema: T,
	request: T,
	variables: N.TypeOfMergedVariables<T>,
	cache: CacheNode
) {
	return () => {
		let evict = constVoid
		const requestCache = getCache(schema, request, variables, cache, () => shallowReactive({}), data)
		for (const k in data) {
			if (requestCache[k] === undefined) {
				requestCache[k] = shallowReactive(new Map())
			}
			evict = concatEvict(
				evict,
				write(data[k], schema.members[k], request.members[k], variables, requestCache[k])()
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
	cache: CacheNode
) {
	return () => {
		const key = encode(request, variables)
		const currentValue = cache.get(key)
		const newValue = shallowReactive(makeBy(data.length, () => shallowReactive(new Map())))
		data.forEach((val, index) => {
			const evict = write(val, schema.wrapped, request.wrapped, variables, newValue[index])()
			return evict
		})
		cache.set(key, newValue)
		return () => {
			if (currentValue) {
				cache.set(key, currentValue)
			} else {
				cache.delete(key)
			}
		}
	}
}

function writeToNonEmptyArrayNode(
	data: NonEmptyArray<any>,
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	variables: object,
	cache: CacheNode
) {
	return () => {
		const key = encode(request, variables)
		const currentValue = cache.get(key)
		const newValue = shallowReactive(makeBy(data.length, () => shallowReactive(new Map())))
		data.forEach((val, index) => write(val, schema.wrapped, request.wrapped, variables, newValue[index])())
		cache.set(key, some(newValue))
		return () => {
			if (currentValue) {
				cache.set(key, currentValue)
			} else {
				cache.delete(key)
			}
		}
	}
}

function writeToOptionNode(
	data: Option<any>,
	schema: N.OptionNode<any>,
	request: N.OptionNode<any>,
	variables: object,
	cache: CacheNode
) {
	return () => {
		const key = encode(request, variables)
		if (isSome(data)) {
			let cacheEntry = getCache(schema, request, variables, cache, () => some(shallowReactive(new Map())), data)
			if (isNone(cacheEntry)) {
				cacheEntry = some(shallowReactive(new Map()))
				cache.set(key, cacheEntry)
			}
			return write(data.value, schema.wrapped, request.wrapped, variables, cacheEntry.value)()
		} else {
			const currentValue = cache.get(key)
			cache.set(key, none)
			return () => {
				if (currentValue) {
					cache.set(key, currentValue)
				}
			}
		}
	}
}

function writeToMapNode(
	data: Map<any, any>,
	schema: N.MapNode<any, any>,
	request: N.MapNode<any, any>,
	variables: object,
	cache: CacheNode
) {
	return () => {
		let evict = constVoid
		const requestCache = getCache(schema, request, variables, cache, () => shallowReactive(new Map()), data)
		for (const [k, v] of data.entries()) {
			evict = concatEvict(
				evict,
				write(
					v,
					schema.wrapped,
					request.wrapped,
					variables,
					makeCache(k, requestCache, () => shallowReactive(new Map()))
				)()
			)
		}
		return evict
	}
}

function writeToSumNode(
	data: any,
	schema: N.SumNode<any>,
	request: N.SumNode<any, any>,
	variables: object,
	cache: CacheNode
) {
	return () => {
		const key = encode(request, variables)
		let requestCache = cache.get(key)
		if (!requestCache || requestCache[0] !== data.__typename) {
			requestCache = shallowReactive([data.__typename, shallowReactive(new Map())] as const)
			cache.set(key, requestCache)
		}
		const __typename = data.__typename || requestCache[0]
		if (!!__typename) {
			return writeToTypeNode(
				data,
				schema.membersRecord[__typename],
				request.membersRecord[__typename],
				variables,
				requestCache[1]
			)()
		} else {
			return constVoid
		}
	}
}

function getCache(
	schemaNode: N.Node,
	requestNode: N.Node,
	variables: object,
	cacheNode: CacheNode,
	cacheData: Lazy<unknown>,
	data?: any
) {
	if (!!schemaNode?.__cache__?.useCustomCache) {
		return makeCache(encode(requestNode, variables), cacheNode, () =>
			(schemaNode as any).__cache__.useCustomCache(schemaNode, requestNode, variables, cacheNode, data)
		)
	} else {
		return makeCache(encode(requestNode, variables), cacheNode, cacheData)
	}
}

function makeCache(key: string, cacheNode: CacheNode, cacheData: Lazy<unknown>) {
	let requestCache = cacheNode.get(key)
	if (!requestCache) {
		requestCache = cacheData()
		cacheNode.set(key, requestCache)
	}
	return requestCache
}

function encode(node: N.Node, data: any): string {
	try {
		return JSON.stringify(node.variablesModel.encode(data))
	} catch {
		return 'unknown'
	}
}
