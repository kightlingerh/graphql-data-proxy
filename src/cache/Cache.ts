import { shallowReactive } from '@vue/reactivity'
import { array, isNonEmpty, makeBy } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import { constant, constVoid, pipe } from 'fp-ts/lib/function'
import { getWitherable, map } from 'fp-ts/lib/Map'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { chain, isNone, isSome, none, option, Option, some } from 'fp-ts/lib/Option'
import { fromCompare } from 'fp-ts/lib/Ord'
import { Reader } from 'fp-ts/lib/Reader'
import * as N from '../node/Node'
import { CacheError, CacheResult, CacheWriteResult, cacheWriteResultMonoid, concatEvict, Persist } from '../shared'
import { isEntityNode, isUniqueNode } from './shared'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	persist?: Persist
}

export interface Cache<R> {
	write(variables: N.TypeOfMergedVariables<R>): Reader<N.TypeOfPartial<R>, CacheWriteResult>
	read(variables: N.TypeOfMergedVariables<R>): CacheResult<O.Option<N.TypeOf<R>>>
}

export function make<S extends N.SchemaNode<any, any>>(schema: S) {
	return (_: CacheDependencies) => {
		return <R extends N.SchemaNode<any, any>>(request: R) => {
			const errors = validate(schema, request)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				const cache = new Map()
				const uniqueNodes = new Map()
				return right<CacheError, Cache<R>>({
					read: (variables) => read(schema, request, variables, cache, uniqueNodes),
					write: (variables) => (data) => write(data, schema, request, variables, cache, uniqueNodes)
				})
			}
		}
	}
}

interface CacheNode extends Map<any, any> {}

interface UniqueNodes extends Map<N.Node, any> {}

function read(
	schema: N.Node,
	request: N.Node,
	variables: object,
	cache: CacheNode,
	uniqueNodes: UniqueNodes
): CacheResult<O.Option<any>> {
	if (isEntityNode(schema)) {
		return () => cache.get(encode(request, variables)) || none
	}
	switch (request.tag) {
		case 'Type':
			return readTypeNode(schema as N.TypeNode<any, any>, request, variables, cache, uniqueNodes)
		case 'Array':
			return readArrayNode(schema as N.ArrayNode<any>, request, variables, cache, uniqueNodes)
		case 'NonEmptyArray':
			return readNonEmptyArrayNode(schema as N.NonEmptyArrayNode<any>, request, variables, cache, uniqueNodes)
		case 'Option':
			return readOptionNode(schema as N.OptionNode<any>, request, variables, cache, uniqueNodes)
		case 'Map':
			return readMapNode(schema as N.MapNode<any, any>, request, variables, cache, uniqueNodes)
		case 'Sum':
			return readSumNode(schema as N.SumNode<any>, request, variables, cache, uniqueNodes)
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
	cache: CacheNode,
	uniqueNodes: UniqueNodes
): CacheResult<O.Option<any>> {
	return () => {
		const key = encode(request, variables)
		const requestCache = isUniqueNode(schema)
			? uniqueNodes.get(schema.members[(schema as any).__cache__.uniqueBy])
			: cache.get(key)
		if (requestCache) {
			const x: any = {}
			for (const k in request.members) {
				if (requestCache[k] === undefined) {
					return none
				}
				const result = read(schema.members[k], request.members[k], variables, requestCache[k], uniqueNodes)()
				if (isNone(result)) {
					return none
				}
				x[k] = result.value
			}
			return some(x)
		} else {
			return none
		}
	}
}

function readArrayNode(
	schema: N.ArrayNode<any>,
	request: N.ArrayNode<any>,
	variables: object,
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const cacheEntry = cache.get(encode(request, variables))
		if (!cacheEntry) {
			return none
		}
		return array.sequence(option)(
			cacheEntry.map((val: CacheNode) => read(schema.wrapped, request.wrapped, variables, val, uniqueNodes)())
		)
	}
}

function readNonEmptyArrayNode(
	schema: N.NonEmptyArrayNode<any>,
	request: N.NonEmptyArrayNode<any>,
	variables: object,
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const cacheEntry = cache.get(encode(request, variables))
		if (!cacheEntry) {
			return none
		}
		return pipe(
			cacheEntry as Option<CacheNode[]>,
			chain((entry) =>
				array.sequence(option)(
					entry.map((val: CacheNode) => read(schema.wrapped, request.wrapped, variables, val, uniqueNodes)())
				)
			)
		)
	}
}

function readOptionNode(
	schema: N.OptionNode<any>,
	request: N.OptionNode<any>,
	variables: object,
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const cacheEntry = cache.get(encode(request, variables))
		if (!cacheEntry) {
			return some(none)
		}
		return some(
			pipe(
				cacheEntry as Option<CacheNode>,
				chain((entry) => read(schema.wrapped, request.wrapped, variables, entry, uniqueNodes)())
			)
		)
	}
}

const mapSequenceOption = getWitherable(fromCompare(constant(0 as const))).sequence(option)

function readMapNode(
	schema: N.MapNode<any, any>,
	request: N.MapNode<any, any>,
	variables: object,
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const cacheEntry = cache.get(encode(request, variables))
		if (!cacheEntry) {
			return none
		}
		return pipe(
			cacheEntry as Map<any, CacheNode>,
			map((val) => read(schema.wrapped, request.wrapped, variables, val, uniqueNodes)()),
			mapSequenceOption
		)
	}
}

function readSumNode(
	schema: N.SumNode<any>,
	request: N.SumNode<any>,
	variables: object,
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const cacheEntry = cache.get(encode(request, variables))
		if (!cacheEntry) {
			return none
		}
		return readTypeNode(
			schema.membersRecord[cacheEntry[0]],
			request.membersRecord[cacheEntry[0]],
			variables,
			cacheEntry[1],
			uniqueNodes
		)()
	}
}

function write(
	data: any,
	schema: N.Node,
	request: N.Node,
	variables: object,
	cache: CacheNode,
	uniqueNodes: UniqueNodes
): CacheWriteResult {
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
			return writeToTypeNode(data, schema as N.TypeNode<any, any>, request, variables, cache, uniqueNodes)
		case 'Array':
			return writeToArrayNode(data, schema as N.ArrayNode<any>, request, variables, cache, uniqueNodes)
		case 'NonEmptyArray':
			return writeToNonEmptyArrayNode(
				data,
				schema as N.NonEmptyArrayNode<any>,
				request,
				variables,
				cache,
				uniqueNodes
			)
		case 'Option':
			return writeToOptionNode(data, schema as N.OptionNode<any>, request, variables, cache, uniqueNodes)
		case 'Map':
			return writeToMapNode(data, schema as N.MapNode<any, any>, request, variables, cache, uniqueNodes)
		case 'Sum':
			return writeToSumNode(data, schema as N.SumNode<any>, request, variables, cache, uniqueNodes)
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
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const isUnique = isUniqueNode(schema)
		const key = isUnique ? schema.members[(schema as any).__cache__.uniqueBy] : encode(request, variables)
		const newCache = isUnique ? uniqueNodes : cache
		let evict = constVoid
		let requestCache = newCache.get(key)
		if (!requestCache) {
			requestCache = shallowReactive({})
			newCache.set(key, requestCache)
		}
		for (const k in data) {
			if (requestCache[k] === undefined) {
				requestCache[k] = shallowReactive(new Map())
			}
			evict = concatEvict(
				evict,
				write(data[k], schema.members[k], request.members[k], variables, requestCache[k], uniqueNodes)()
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
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const key = encode(request, variables)
		const currentValue = cache.get(key)
		const newValue = shallowReactive(makeBy(data.length, () => shallowReactive(new Map())))
		data.forEach((val, index) => {
			console.log(val, newValue)
			const evict = write(val, schema.wrapped, request.wrapped, variables, newValue[index], uniqueNodes)()
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
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const key = encode(request, variables)
		const currentValue = cache.get(key)
		const newValue = shallowReactive(makeBy(data.length, () => shallowReactive(new Map())))
		data.forEach((val, index) =>
			write(val, schema.wrapped, request.wrapped, variables, newValue[index], uniqueNodes)()
		)
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
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const key = encode(request, variables)
		if (isSome(data)) {
			let requestCache = cache.get(key)
			if (!requestCache) {
				requestCache = some(shallowReactive(new Map()))
				cache.set(key, requestCache)
			}
			return write(data.value, schema.wrapped, request.wrapped, variables, requestCache.value, uniqueNodes)()
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
	cache: CacheNode,
	uniqueNodes: UniqueNodes
) {
	return () => {
		const key = encode(request, variables)
		let requestCache = cache.get(key)
		let evict = constVoid
		if (!requestCache) {
			requestCache = shallowReactive(new Map())
			cache.set(key, requestCache)
		}
		for (const [k, v] of data.entries()) {
			let selectionCache = requestCache.get(k)
			if (!selectionCache) {
				selectionCache = shallowReactive(new Map())
				requestCache.set(k, selectionCache)
			}
			evict = concatEvict(
				evict,
				write(v, schema.wrapped, request.wrapped, variables, selectionCache, uniqueNodes)()
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
	cache: CacheNode,
	uniqueNodes: UniqueNodes
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
				requestCache[1],
				uniqueNodes
			)()
		} else {
			return constVoid
		}
	}
}

function encode(node: N.Node, data: any): string {
	try {
		return JSON.stringify(node.variablesModel.encode(data))
	} catch {
		return 'unknown'
	}
}
