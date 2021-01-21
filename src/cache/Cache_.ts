import { IO, of, map as mapIO, traverseArray as traverseArrayIO, sequenceArray as sequenceArrayIO } from 'fp-ts/IO'
import { rightIO, chain as chainTE } from 'fp-ts/TaskEither'
import { fromIO, chain as chainT, map as mapT, traverseArrayWithIndex, Task } from 'fp-ts/Task'
import { drawForest } from 'fp-ts/Tree'
import { computed, shallowReactive, shallowRef } from 'vue'
import { isEmpty, isNonEmpty, snoc } from 'fp-ts/lib/Array'
import { isLeft, left, right } from 'fp-ts/lib/Either'
import { constant, pipe } from 'fp-ts/lib/function'
import { fromArray, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { chain, isNone, none, Option, some, sequenceArray, isSome, map as mapO, fold } from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { ArrayNode, NodeTag, Path } from '../node'
import * as N from '../node'
import { CacheError, CacheResult, Persist } from '../shared'
import { isEntityNode, PrimitiveNode, traverseMap } from './shared'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	persist?: Persist
}

export interface CacheWriteResult extends Task<Evict> {}

export interface Evict extends IO<void> {}

export interface Cache<R> {
	write(variables: N.TypeOfMergedVariables<R>): Reader<N.TypeOfPartial<R>, CacheWriteResult>
	read(variables: N.TypeOfMergedVariables<R>): CacheResult<Option<N.TypeOf<R>>>
	toEntries(variables: N.TypeOfMergedVariables<R>): CacheResult<N.TypeOfCacheEntry<R>>
}

export function make(_: CacheDependencies) {
	return <S extends N.SchemaNode<any, any>>(schema: S) => {
		const cache: object = shallowReactive(Object.create(null))
		return <R extends N.SchemaNode<any, any>>(request: R) => {
			const errors = validate(schema, request)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				return right<CacheError, Cache<R>>({
					read: (variables) => read(schema, request, variables, cache),
					write: (variables) => (data) => write(data, schema, request, variables, cache),
					toEntries: (variables) => toRefs(schema, request, variables, cache)
				})
			}
		}
	}
}

abstract class CacheNode {
	protected constructor(
		readonly schemaNode: N.Node,
		readonly requestNode: N.Node,
		readonly path: Path,
		readonly persist?: Persist
	) {
		this.read = this.read.bind(this)
		this.toEntries = this.toEntries.bind(this)
		this.write = this.write.bind(this)
	}
	abstract read(variables: Record<string, unknown>): CacheResult<Option<unknown>>
	abstract toEntries(variables: Record<string, unknown>): IO<unknown>
	abstract write(variables: Record<string, unknown>, data: unknown): CacheWriteResult
}

class PrimitiveCacheNode extends CacheNode {
	readonly entry = shallowRef(none as Option<unknown>)
	constructor(
		readonly schemaNode: PrimitiveNode,
		readonly requestNode: PrimitiveNode,
		readonly path: Path,
		readonly persist?: Persist
	) {
		super(schemaNode, requestNode, path, persist)
		this.toEntry = this.toEntry.bind(this)
		this.readValue = this.readValue.bind(this)
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
	toEntries() {
		return this.toEntry
	}
	write(_, value: unknown) {
		return async () => {
			const currentValue = this.entry.value
			this.entry.value = some(value)
			return () => {
				if (isSome(this.entry.value) && this.entry.value.value === value) {
					this.entry.value = currentValue
				}
			}
		}
	}
}

// @ts-ignore
const CACHE_NODES: Record<NodeTag, any> = {
	Boolean: PrimitiveCacheNode,
	Int: PrimitiveCacheNode,
	Float: PrimitiveCacheNode,
	String: PrimitiveCacheNode,
	Array: ArrayCacheNode,
	NonEmptyArray: NonEmptyArrayCacheNode,
	Map: MapCacheNode,
	Nullable: PrimitiveCacheNode,
	Mutation: PrimitiveCacheNode,
	Option: OptionCacheNode,
	Scalar: PrimitiveCacheNode,
	Set: PrimitiveCacheNode,
	Sum: PrimitiveCacheNode,
	Type: PrimitiveCacheNode
}

class MapCacheNode extends CacheNode {
	readonly entry = shallowReactive(new Map<unknown, CacheNode>())
	constructor(
		readonly schemaNode: ArrayNode<any, any, any>,
		readonly requestNode: ArrayNode<any, any, any>,
		readonly path: Path,
		readonly persist?: Persist
	) {
		super(schemaNode, requestNode, path, persist)
		this.newNode = this.newNode.bind(this)
		this.toNode = this.toNode.bind(this)
		this.writeToNode = this.writeToNode.bind(this)
		this.toEntry = this.toEntry.bind(this)
	}
	private newNode(key: unknown) {
		return new CACHE_NODES[this.schemaNode.item.tag](
			this.schemaNode.item,
			this.requestNode.item,
			snoc(this.path, key),
			this.persist
		)
	}
	read(variables: Record<string, unknown>) {
		return () => {
			const newMap = new Map<unknown, unknown>()
			for (const [key, value] of this.entry.entries()) {
				const readValue = value.read(variables)()
				if (isNone(readValue)) {
					return none
				}
				newMap.set(key, readValue.value)
			}
			return some(newMap)
		}
	}
	private toEntry(variables: Record<string, unknown>) {
		return (node: CacheNode) => node.toEntries(variables)()
	}
	toEntries(variables: Record<string, unknown>) {
		return () => traverseMap(this.toEntry(variables))(this.entry)
	}
	private toNode(key: unknown): IO<[CacheNode, boolean]> {
		return () => {
			const keyEntry = this.entry.get(key)
			if (keyEntry) {
				return [keyEntry, false]
			}
			const newEntry = this.newNode(key)
			this.entry.set(key, newEntry)
			return [newEntry as CacheNode, true]
		}
	}
	private writeToNode(variables: Record<string, unknown>) {
		return (key: unknown, data: unknown): CacheWriteResult => {
			return pipe(
				fromIO(this.toNode(key)),
				chainT(([node, isNew]) =>
					isNew
						? async () => {
								await node.write(variables, data)()
								return () => {
									this.entry.delete(key)
								}
						  }
						: node.write(variables, data)
				)
			)
		}
	}
	write(variables: Record<string, unknown>, data: Map<unknown, unknown>) {
		const _write = this.writeToNode(variables)
		return async () => {
			const evictions: Promise<Evict>[] = []
			let iteration = 0
			for (const [key, value] of data.entries()) {
				evictions.push(_write(key, value)())
				iteration++
				if (evictions.length % 100 === 0) {
					await Promise.all(evictions.slice(iteration - 100, iteration)) // if we are writing a huge map, break it apart into separate chunks and give the main thread a break
				}
			}
			return sequenceArrayIO(await Promise.all(evictions))
		}
	}
}

class ArrayCacheNode extends CacheNode {
	readonly entry = shallowReactive([] as CacheNode[])
	constructor(
		readonly schemaNode: ArrayNode<any, any, any>,
		readonly requestNode: ArrayNode<any, any, any>,
		readonly path: Path,
		readonly persist?: Persist
	) {
		super(schemaNode, requestNode, path, persist)
		this.newNode = this.newNode.bind(this)
		this.toNode = this.toNode.bind(this)
		this.writeToNode = this.writeToNode.bind(this)
		this.readNode = this.readNode.bind(this)
	}
	private newNode(index: number) {
		return new CACHE_NODES[this.schemaNode.item.tag](
			this.schemaNode.item,
			this.requestNode.item,
			snoc(this.path, index),
			this.persist
		)
	}
	private readNode(variables: Record<string, unknown>) {
		return (node: CacheNode) => node.read(variables)
	}
	read(variables: Record<string, unknown>) {
		return pipe(this.entry, traverseArrayIO(this.readNode(variables)), mapIO(sequenceArray))
	}
	toEntries(variables: Record<string, unknown>) {
		return () => this.entry.map((n) => n.toEntries(variables)())
	}
	private toNode(index: number): IO<[CacheNode, boolean]> {
		return () => {
			let isNew = false
			let indexEntry = this.entry[index]
			if (!indexEntry) {
				indexEntry = this.newNode(index)
				this.entry[index] = indexEntry
				isNew = true
			}
			return [indexEntry, isNew]
		}
	}
	private writeToNode(variables: Record<string, unknown>) {
		return (index: number, data: unknown): CacheWriteResult => {
			return pipe(
				fromIO(this.toNode(index)),
				chainT(([node, isNew]) =>
					isNew
						? async () => {
								await node.write(variables, data)()
								return () => this.entry.splice(index, 1)
						  }
						: node.write(variables, data)
				)
			)
		}
	}
	write(variables: Record<string, unknown>, value: unknown[]) {
		return async () => {
			const _write = this.writeToNode(variables)
			const length = value.length
			const evictions: Promise<IO<void>>[] = []
			for (let i = 0; i < length; i++) {
				evictions.push(_write(i, value[i])())
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
		readonly schemaNode: ArrayNode<any, any, any>,
		readonly requestNode: ArrayNode<any, any, any>,
		readonly path: Path,
		readonly persist?: Persist
	) {
		this.cache = new ArrayCacheNode(schemaNode, requestNode, path, persist)
	}
	read(variables: Record<string, unknown>) {
		// @ts-ignore
		return pipe(this.cache.read(variables), mapT(chain(fromArray)))
	}
	toEntries(variables: Record<string, unknown>) {
		return computed(() => fromArray(this.cache.toEntries(variables)()))
	}
	write(variables: Record<string, unknown>, value: unknown[]) {
		return this.cache.write(variables, value)
	}
}

class OptionCacheNode extends CacheNode {
	readonly entry = shallowRef(none as Option<CacheNode>)
	constructor(
		readonly schemaNode: N.OptionNode<any, any, any>,
		readonly requestNode: N.OptionNode<any, any, any>,
		readonly path: Path,
		readonly persist?: Persist
	) {
		super(schemaNode, requestNode, path, persist)
	}
	read(variables: Record<string, unknown>) {
		return pipe(
			this.entry.value,
			fold(constant(of(none)), (node) => node.read(variables))
		)
	}
	toEntries(variables: Record<string, unknown>) {
		return () =>
			pipe(
				this.entry.value,
				mapO((node) => node.toEntries(variables))
			)
	}

	write(variables: Record<string, unknown>, data: Option<unknown>) {
		return async () => {
			const currentValue = this.entry.value
			if (isSome(data)) {
				if (isNone(currentValue)) {
					const newEntry = new CACHE_NODES[this.schemaNode.item._tag](
						this.schemaNode.item,
						this.requestNode.tag,
						snoc(this.path, 'value'),
						this.persist
					)
					newEntry.write(variables, data.value)()
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
		case 'Map':
			return shallowRef(shallowReactive(new Map())) as N.TypeOfCacheEntry<T>
		case 'Mutation':
			return useDefaultCacheEntry((node as any).result) as N.TypeOfCacheEntry<T>
		default:
			return shallowRef<Option<N.TypeOf<T>>>(none) as N.TypeOfCacheEntry<T>
	}
}
