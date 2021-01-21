import { IO, of, map as mapIO, traverseArray as traverseArrayIO, sequenceArray as sequenceArrayIO } from 'fp-ts/IO'
import { fromIO, map as mapT, Task, chain as chainT } from 'fp-ts/Task'
import { computed, shallowReactive, shallowRef } from 'vue'
import { isNonEmpty, snoc } from 'fp-ts/Array'
import { left, right } from 'fp-ts/Either'
import { absurd, constant, pipe } from 'fp-ts/function'
import { fromArray } from 'fp-ts/NonEmptyArray'
import { chain, isNone, none, Option, some, sequenceArray, isSome, map as mapO, fold } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { Model } from '../model'
import { Ref } from '../node'
import * as N from '../node'
import { CacheError, CacheResult, isEmptyObject, Persist } from '../shared'
import { CacheGraphqlNode, isNonPrimitiveEntityNode, PrimitiveNode, traverseMap } from './shared'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	persist?: Persist
}

export interface CacheWriteResult extends Task<Evict> {}

export interface Evict extends IO<void> {}

export interface Cache<R extends N.SchemaNode<any, any>> {
	read: Reader<N.TypeOfMergedVariables<R>, IO<Option<N.TypeOf<R>>>>
	write: Reader<N.TypeOfMergedVariables<R>, Reader<N.TypeOfPartial<R>, CacheWriteResult>>
	toEntries: Reader<N.TypeOfMergedVariables<R>, IO<N.TypeOfRefs<R>>>
}

export function make(deps: CacheDependencies) {
	return <S extends N.SchemaNode<any, any>>(schema: S) => {
		const cache = new SchemaCacheNode(schema, deps)
		return <R extends N.SchemaNode<any, any>>(request: R) => {
			if (__DEV__) {
				const errors = validate(schema, request)
				if (isNonEmpty(errors)) {
					return left<CacheError, Cache<R>>(errors)
				} else {
					return right<CacheError, Cache<R>>({
						read: cache.useRead(request),
						write: cache.write,
						toEntries: cache.useToEntries(request)
					})
				}
			}
			return right<CacheError, Cache<R>>({
				read: cache.useRead(request),
				write: cache.write,
				toEntries: cache.useToEntries(request)
			})
		}
	}
}

class SchemaCacheNode<S extends N.SchemaNode<any, any>> {
	readonly entry: TypeCacheNode
	private pendingWrites: Array<Task<void>> = []
	private hasActiveWrite: boolean = false
	constructor(schemaNode: S, deps: CacheDependencies) {
		this.entry = new TypeCacheNode(schemaNode, deps.id ? [deps.id] : [], new Map(), deps.persist)
		this.useRead = this.useRead.bind(this)
		this.write = this.write.bind(this)
		this.useToEntries = this.useToEntries.bind(this)
		this.applyWrites = this.applyWrites.bind(this)
	}
	useRead<R extends N.SchemaNode<any, any>>(
		requestNode: R
	): Reader<N.TypeOfMergedVariables<R>, IO<Option<N.TypeOf<R>>>> {
		return (variables) => this.entry.read(requestNode, variables)
	}
	private applyWrites() {
		this.hasActiveWrite = false
		const task = this.pendingWrites.shift()
		if (task) {
			this.hasActiveWrite = true
			task().then(this.applyWrites)
		}
	}
	write<R extends N.SchemaNode<any, any>>(
		variables: N.TypeOfMergedVariables<R>
	): Reader<N.TypeOfPartial<R>, CacheWriteResult> {
		return (data) => {
			return () =>
				new Promise((resolve) => {
					this.pendingWrites.push(
						pipe(
							this.entry.write(variables, data),
							chainT((evict) =>
								fromIO(() => {
									resolve(evict)
								})
							)
						)
					)
					// if this is the only task in the queue, start applying writes, otherwise other writes are in progress
					if (!this.hasActiveWrite) {
						this.applyWrites()
					}
				})
		}
	}
	useToEntries<R extends N.SchemaNode<any, any>>(
		requestNode: R
	): Reader<N.TypeOfMergedVariables<R>, IO<N.TypeOfRefs<R>>> {
		return (variables) => this.entry.toEntries(requestNode, variables) as IO<N.TypeOfRefs<R>>
	}
}

abstract class CacheNode {
	protected constructor(readonly schemaNode: N.Node, readonly path: N.Path, readonly persist?: Persist) {
		this.read = this.read.bind(this)
		this.useEntries = this.useEntries.bind(this)
		this.write = this.write.bind(this)
		this.toEntries = this.toEntries.bind(this)
	}
	abstract read(requestNode: N.Node, variables: Record<string, unknown>): CacheResult<Option<unknown>>
	toEntries(requestNode: N.Node, variables: Record<string, unknown>): IO<unknown> {
		return isNonPrimitiveEntityNode(requestNode)
			? () => computed(this.read(requestNode, variables))
			: this.useEntries(requestNode, variables)
	}
	abstract useEntries(requestNode: N.Node, variables: Record<string, unknown>): IO<unknown>
	abstract write(variables: Record<string, unknown>, data: unknown): CacheWriteResult
}

class PrimitiveCacheNode extends CacheNode {
	readonly entry = shallowRef(none as Option<unknown>)
	constructor(readonly schemaNode: PrimitiveNode, readonly path: N.Path, readonly persist?: Persist, data?: unknown) {
		super(schemaNode, path, persist)
		this.toEntry = this.toEntry.bind(this)
		this.readValue = this.readValue.bind(this)
		if (data) {
			this.entry.value = some(data)
		}
	}
	private readValue() {
		return this.entry.value
	}
	read() {
		return this.readValue
	}
	private toEntry() {
		return this.entry
	}
	useEntries() {
		return this.toEntry
	}
	write(_: Record<string, unknown>, value: unknown) {
		return async () => {
			const currentValue = this.entry.value
			this.entry.value = some(value)
			return () => {
				// check that another write hasn't already occurred
				if (isSome(this.entry.value) && this.entry.value.value === value) {
					this.entry.value = currentValue
				}
			}
		}
	}
}

function useNewCacheNode(
	node: CacheGraphqlNode,
	path: N.Path,
	uniqueNodes: Map<unknown, CacheNode>,
	persist?: Persist,
	variables?: Record<string, unknown>,
	data?: unknown
) {
	if (!!node.__isEntity) {
		return new PrimitiveCacheNode(node as PrimitiveNode, path, persist, data)
	}
	switch (node.tag) {
		case 'Map':
			return new MapCacheNode(node, path, uniqueNodes, persist)
		case 'Option':
			return new OptionCacheNode(node, path, uniqueNodes, persist)
		case 'NonEmptyArray':
			return new NonEmptyArrayCacheNode(node as any, path, uniqueNodes, persist)
		case 'Array':
			return new ArrayCacheNode(node, path, uniqueNodes, persist)
		case 'Sum':
			return new SumCacheNode(
				node,
				path,
				uniqueNodes,
				persist,
				variables,
				data as Record<string, unknown> | undefined
			)
		case 'Type':
			return new TypeCacheNode(
				node,
				path,
				uniqueNodes,
				persist,
				variables,
				data as Record<string, unknown> | undefined
			)
		default:
			return new PrimitiveCacheNode(node as PrimitiveNode, path, persist, data)
	}
}

class SumCacheNode extends CacheNode {
	readonly entry: N.Ref<Option<[string, CacheNode]>> = shallowRef(none)
	constructor(
		readonly schemaNode: N.SumNode<any, any, any>,
		readonly path: N.Path,
		readonly uniqueNodes: Map<unknown, CacheNode>,
		readonly persist?: Persist,
		readonly variables?: Record<string, unknown>,
		readonly data?: Record<string, unknown>
	) {
		super(schemaNode, path, persist)
		if (data && variables && typeof data.__typename === 'string') {
			this.entry.value = some([
				data.__typename,
				useNewCacheNode(
					(schemaNode.membersRecord as any)[data.__typename],
					path,
					uniqueNodes,
					persist,
					variables,
					data
				) as CacheNode
			])
		}
	}

	read(requestNode: N.SumNode<any, any, any, any>, variables: Record<string, unknown>) {
		return () => {
			return isSome(this.entry.value)
				? this.entry.value.value[1].read(
						(requestNode.membersRecord as any)[this.entry.value.value[0]],
						variables
				  )()
				: none
		}
	}
	useEntries(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
		return () => {
			return computed(() =>
				isSome(this.entry.value) ? this.entry.value.value[1].toEntries(requestNode, variables)() : none
			)
		}
	}
	write(variables: Record<string, unknown>, data: Record<string, unknown>) {
		return async () => {
			// check if current value needs to be overwritten
			if (isNone(this.entry.value) || (data.__typename && this.entry.value.value[0] !== data.__typename)) {
				const __typename = data.__typename as string
				this.entry.value = some([
					__typename as string,
					useNewCacheNode(
						(this.schemaNode.membersRecord as any)[__typename],
						this.path,
						this.uniqueNodes,
						this.persist,
						variables,
						data
					) as CacheNode
				])
			}
			const __typename = data.__typename || (this.entry as any).value.value[0]
			if (!!__typename && isSome(this.entry.value)) {
				return this.entry.value.value[1].write(variables, data)
			} else {
				return absurd as IO<void>
			}
		}
	}
}

class TypeCacheNode extends CacheNode {
	readonly entry: Ref<Record<string, CacheNode | Map<string, CacheNode>>>
	readonly models: Record<string, Model<any, any, any>> = Object.create(null)
	constructor(
		readonly schemaNode: N.TypeNode<any, any, any, any, any>,
		readonly path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		readonly persist?: Persist,
		readonly variables?: Record<string, unknown>,
		readonly data?: Record<string, unknown>
	) {
		super(schemaNode, path, persist)
		this.entry = shallowRef(this.buildEntry(variables, data))
		if (schemaNode.__customCache) {
			this.useEntry(variables, data)
		}
	}
	private buildEntry(variables?: Record<string, unknown>, data?: Record<string, unknown>) {
		const newEntry = Object.create(null)
		for (const key in this.schemaNode.members) {
			const member: N.Node = this.schemaNode.members[key]
			const hasVariables = !isEmptyObject(member.variables)
			newEntry[key] = hasVariables
				? new Map()
				: useNewCacheNode(
						member as CacheGraphqlNode,
						snoc(this.path, key),
						this.uniqueNodes,
						this.persist,
						variables,
						data
				  )
			if (hasVariables) {
				this.models[key] = N.useVariablesModel(member.variables)
			}
		}
		return newEntry
	}
	private useEntry(variables?: Record<string, unknown>, data?: Record<string, unknown>) {
		if (this.schemaNode.__customCache) {
			const customCache = this.schemaNode.__customCache
			const id = customCache.toId(this.path, variables, data)
			if (id === null || id === undefined) {
				return this.entry.value
			} else {
				const nodes = customCache.nodes ?? this.uniqueNodes
				let newEntry = nodes.get(id)
				if (newEntry) {
					if (newEntry !== this.entry.value) {
						this.entry.value = newEntry
					}
					return newEntry
				}
				nodes.set(id, this.entry.value)
				return this.entry.value
			}
		} else {
			return this.entry.value
		}
	}
	private useCacheNode(
		entry: Record<string, CacheNode | Map<string, CacheNode>>,
		key: string,
		variables: Record<string, unknown>,
		data?: Record<string, unknown>
	): CacheNode {
		if (this.models.hasOwnProperty(key)) {
			const encodedVariables = JSON.stringify(this.models[key].encode(variables))
			const newEntry = (entry[key] as Map<string, CacheNode>).get(encodedVariables)
			if (newEntry) {
				return newEntry
			} else {
				const n = useNewCacheNode(
					this.schemaNode.members[key],
					snoc(this.path, key),
					this.uniqueNodes,
					this.persist,
					variables,
					data
				) as CacheNode
				;(entry[key] as Map<string, CacheNode>).set(key, n)
				return n
			}
		}
		return entry[key] as CacheNode
	}
	read(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
		return () => {
			const result = Object.create(null)
			const entry = this.useEntry(variables)
			for (const key in requestNode.members) {
				const r = this.useCacheNode(entry, key, variables).read(requestNode.members[key], variables)()
				if (isNone(r)) {
					return r
				}
				result[key] = r.value
			}
			return some(result)
		}
	}
	useEntries(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
		return () => {
			const requestEntries = Object.create(null)
			const entry = this.useEntry(variables)
			for (const key in requestNode.members) {
				requestEntries[key] = this.useCacheNode(entry, key, variables).toEntries(
					requestNode.members[key],
					variables
				)()
			}
			return requestEntries
		}
	}
	write(variables: Record<string, unknown>, data: Record<string, unknown>) {
		return async () => {
			const evictions: Promise<Evict>[] = []
			const entry = this.useEntry(variables, data)
			for (const key in data) {
				evictions.push(this.useCacheNode(entry, key, variables, data).write(variables, data[key])())
			}
			return sequenceArrayIO(await Promise.all(evictions))
		}
	}
}

class MapCacheNode extends CacheNode {
	readonly entry: Map<unknown, CacheNode>
	constructor(
		readonly schemaNode: N.MapNode<any, any, any, any, any, any>,
		readonly path: N.Path,
		readonly uniqueNodes: Map<unknown, CacheNode>,
		readonly persist?: Persist
	) {
		super(schemaNode, path, persist)
		this.useCacheNode = this.useCacheNode.bind(this)
		this.useWriteToNode = this.useWriteToNode.bind(this)
		this.useEntry = this.useEntry.bind(this)
		this.entry = schemaNode.__customCache
			? (schemaNode.__customCache.entry as Map<unknown, CacheNode>)
			: shallowReactive(new Map())
	}
	read(requestNode: N.MapNode<any, any, any, any, any, any, any, any>, variables: Record<string, unknown>) {
		return () => {
			const newMap = new Map<unknown, unknown>()
			for (const [key, value] of this.entry.entries()) {
				const readValue = value.read(requestNode.item, variables)()
				if (isNone(readValue)) {
					return none
				}
				newMap.set(key, readValue.value)
			}
			return some(newMap)
		}
	}
	private useEntry(requestNode: N.Node, variables: Record<string, unknown>) {
		return (node: CacheNode) => node.toEntries(requestNode, variables)()
	}
	useEntries(requestNode: N.MapNode<any, any, any, any, any, any, any, any>, variables: Record<string, unknown>) {
		return () => traverseMap(this.useEntry(requestNode.item, variables))(this.entry)
	}
	private useCacheNode(key: unknown, variables?: Record<string, unknown>, data?: unknown): [CacheNode, boolean] {
		const keyEntry = this.entry.get(key)
		if (keyEntry) {
			return [keyEntry, false]
		}
		const newEntry = useNewCacheNode(
			this.schemaNode.item,
			snoc(this.path, key as string | number),
			this.uniqueNodes,
			this.persist,
			variables,
			data
		) as CacheNode
		this.entry.set(key, newEntry)
		return [newEntry as CacheNode, true]
	}
	private useWriteToNode(variables: Record<string, unknown>) {
		return (key: unknown, data: unknown): CacheWriteResult => {
			return async () => {
				const [node, isNew] = this.useCacheNode(key, variables, data)
				if (isNew) {
					await node.write(variables, data)()
					return () => {
						this.entry.delete(key)
					}
				}
				return node.write(variables, data)()
			}
		}
	}
	write(variables: Record<string, unknown>, data: Map<unknown, unknown>) {
		const _write = this.useWriteToNode(variables)
		return async () => {
			const evictions: Promise<Evict>[] = []
			let iteration = 0
			for (const [key, value] of data.entries()) {
				evictions.push(_write(key, value)())
				iteration++
				// give main thread a break every 100 writes
				if (evictions.length % 100 === 0) {
					await Promise.all(evictions.slice(iteration - 100, iteration))
				}
			}
			return sequenceArrayIO(await Promise.all(evictions))
		}
	}
}

class ArrayCacheNode extends CacheNode {
	readonly entry = shallowReactive([] as CacheNode[])
	constructor(
		readonly schemaNode: N.ArrayNode<any, any, any, any>,
		readonly path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		readonly persist?: Persist
	) {
		super(schemaNode, path, persist)
		this.useCacheNode = this.useCacheNode.bind(this)
		this.writeToNode = this.writeToNode.bind(this)
		this.readNode = this.readNode.bind(this)
	}
	private readNode(requestNode: N.Node, variables: Record<string, unknown>) {
		return (node: CacheNode) => node.read(requestNode, variables)
	}
	read(requestNode: N.ArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return pipe(this.entry, traverseArrayIO(this.readNode(requestNode.item, variables)), mapIO(sequenceArray))
	}
	useEntries(requestNode: N.ArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return () => this.entry.map((n) => n.toEntries(requestNode.item, variables)())
	}
	private useCacheNode(index: number, variables?: Record<string, unknown>, data?: unknown): [CacheNode, boolean] {
		let isNew = false
		let indexEntry = this.entry[index]
		if (!indexEntry) {
			indexEntry = useNewCacheNode(
				this.schemaNode.item,
				snoc(this.path, index),
				this.uniqueNodes,
				this.persist,
				variables,
				data
			) as CacheNode
			this.entry[index] = indexEntry
			isNew = true
		}
		return [indexEntry, isNew]
	}
	private writeToNode(variables: Record<string, unknown>) {
		return (index: number, data: unknown): CacheWriteResult => {
			return async () => {
				if (data === null || data === undefined) {
					const cv = this.entry[index]
					this.entry.splice(index, 1)
					return () => {
						if (this.entry[index] === undefined) {
							this.entry.splice(index, 1, cv)
						}
					}
				}
				const [node, isNew] = this.useCacheNode(index, variables, data)
				if (isNew) {
					await node.write(variables, data)()
					return () => {
						if (this.entry[index] === undefined) {
							this.entry.splice(index, 1)
						}
					}
				}
				return node.write(variables, data)()
			}
		}
	}
	write(variables: Record<string, unknown>, value: unknown[]) {
		return async () => {
			const _write = this.writeToNode(variables)
			const length = value.length
			const evictions: Promise<IO<void>>[] = []
			for (let i = 0; i < length; i++) {
				evictions.push(_write(i, value[i])())
				// give main thread a break every 100 writes
				if (i % 100 === 0) {
					await Promise.all(evictions.slice(i - 100, i))
				}
			}
			return sequenceArrayIO(await Promise.all(evictions))
		}
	}
}

class NonEmptyArrayCacheNode {
	readonly cache: ArrayCacheNode
	constructor(
		readonly schemaNode: N.MapNode<any, any, any, any, any, any, any, any>,
		readonly path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		readonly persist?: Persist
	) {
		this.cache = new ArrayCacheNode(schemaNode as any, path, uniqueNodes, persist)
	}
	read(requestNode: N.NonEmptyArrayNode<any, any, any>, variables: Record<string, unknown>) {
		// @ts-ignore
		return pipe(this.cache.read(requestNode, variables), mapT(chain(fromArray)))
	}
	toEntries(requestNode: N.NonEmptyArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return computed(() => fromArray(this.cache.toEntries(requestNode as any, variables)() as unknown[]))
	}
	write(variables: Record<string, unknown>, value: unknown[]) {
		return this.cache.write(variables, value)
	}
}

class OptionCacheNode extends CacheNode {
	readonly entry = shallowRef(none as Option<CacheNode>)
	constructor(
		readonly schemaNode: N.OptionNode<any, any, any>,
		readonly path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		readonly persist?: Persist
	) {
		super(schemaNode, path, persist)
	}
	read(requestNode: N.OptionNode<any, any, any>, variables: Record<string, unknown>) {
		return pipe(
			this.entry.value,
			fold(constant(of(none)), (node) => node.read(requestNode.item, variables))
		)
	}
	useEntries(requestNode: N.OptionNode<any, any, any>, variables: Record<string, unknown>) {
		return () =>
			pipe(
				this.entry.value,
				mapO((node) => node.toEntries(requestNode.item, variables))
			)
	}

	write(variables: Record<string, unknown>, data: Option<unknown>) {
		return async () => {
			const currentValue = this.entry.value
			if (isSome(data)) {
				if (isNone(currentValue)) {
					const newEntry = useNewCacheNode(
						this.schemaNode.item,
						snoc(this.path, 'value'),
						this.uniqueNodes,
						this.persist,
						variables,
						data
					)
					await newEntry.write(variables, data.value as any)()
					return () => {
						if (isSome(this.entry.value)) {
							this.entry.value = none
						}
					}
				}
				return currentValue.value.write(variables, data.value)()
			} else {
				this.entry.value = none
				return () => {
					if (isNone(this.entry.value)) {
						this.entry.value = currentValue
					}
				}
			}
		}
	}
}
