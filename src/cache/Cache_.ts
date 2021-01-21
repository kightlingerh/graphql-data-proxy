import { IO, of, map as mapIO, traverseArray as traverseArrayIO, sequenceArray as sequenceArrayIO } from 'fp-ts/IO'
import { fromIO, chain as chainT, map as mapT, Task } from 'fp-ts/Task'
import { Encoder } from 'io-ts/lib/Encoder'
import { computed, shallowReactive, shallowRef } from 'vue'
import { isNonEmpty, snoc } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import { constant, constVoid, pipe } from 'fp-ts/lib/function'
import { fromArray } from 'fp-ts/lib/NonEmptyArray'
import { chain, isNone, none, Option, some, sequenceArray, isSome, map as mapO, fold } from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { Model } from '../model/Model'
import { ArrayNode, NodeTag, Path, Ref } from '../node'
import * as N from '../node'
import { CacheError, CacheResult, isEmptyObject, Persist } from '../shared'
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
	protected constructor(readonly schemaNode: N.Node, readonly path: Path, readonly persist?: Persist) {
		this.read = this.read.bind(this)
		this.toEntries = this.toEntries.bind(this)
		this.write = this.write.bind(this)
	}
	abstract read(requestNode: N.Node, variables: Record<string, unknown>): CacheResult<Option<unknown>>
	abstract toEntries(requestNode: N.Node, variables: Record<string, unknown>): IO<unknown>
	abstract write(variables: Record<string, unknown>, data: unknown): CacheWriteResult
}

class PrimitiveCacheNode extends CacheNode {
	readonly entry = shallowRef(none as Option<unknown>)
	constructor(readonly schemaNode: PrimitiveNode, readonly path: Path, readonly persist?: Persist) {
		super(schemaNode, path, persist)
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

const CACHE_NODES: Record<NodeTag, any> = {
	Boolean: PrimitiveCacheNode,
	Int: PrimitiveCacheNode,
	Float: PrimitiveCacheNode,
	String: PrimitiveCacheNode,
	// @ts-ignore
	Array: ArrayCacheNode,
	// @ts-ignore
	NonEmptyArray: NonEmptyArrayCacheNode,
	// @ts-ignore
	Map: MapCacheNode,
	Mutation: PrimitiveCacheNode,
	// @ts-ignore
	Option: OptionCacheNode,
	Scalar: PrimitiveCacheNode,
	Sum: SumCacheNode,
	Type: TypeCacheNode
}

function useNewCacheNode(node: N.Node, path: Path, persist?: Persist): CacheNode {
	if (!!node.__isEntity) {
		return new PrimitiveCacheNode(node as PrimitiveNode, path, persist)
	}
	return new CACHE_NODES[node.tag](node, path, persist)
}

class SumCacheNode extends CacheNode {
	readonly entry: Ref<Option<[string, CacheNode]>> = shallowRef(none)
	constructor(readonly schemaNode: N.SumNode<any, any, any>, readonly path: Path, readonly persist?: Persist) {
		super(schemaNode, path, persist)
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
	toEntries(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
		return () => {
			return computed(() =>
				isSome(this.entry.value) ? this.entry.value.value[1].toEntries(requestNode, variables)() : none
			)
		}
	}
	write(variables: Record<string, unknown>, data: Record<string, unknown>) {
		return async () => {
			if (isNone(this.entry.value) || (data.__typename && this.entry.value.value[0] !== data.__typename)) {
				const __typename = data.__typename as string
				this.entry.value = some([
					__typename as string,
					useNewCacheNode((this.schemaNode.membersRecord as any)[__typename], this.path, this.persist)
				])
			}
			const __typename = data.__typename || (this.entry as any).value.value[0]
			if (!!__typename && isSome(this.entry.value)) {
				return this.entry.value.value[1].write(variables, data)
			} else {
				return constVoid
			}
		}
	}
}

class TypeCacheNode extends CacheNode {
	readonly entries: Record<string, CacheNode | Map<string, CacheNode>> = Object.create(null)
	readonly models: Record<string, Model<any, any, any>> = Object.create(null)
	constructor(readonly schemaNode: N.TypeNode<any, any, any, any>, readonly path: Path, readonly persist?: Persist) {
		super(schemaNode, path, persist)
		for (const key in schemaNode.members) {
			const member: N.Node = schemaNode.members[key]
			const hasVariables = !isEmptyObject(member.variables)
			this.entries[key] = hasVariables ? new Map() : this.useStaticCacheNode(key, member)
			if (hasVariables) {
				this.models[key] = N.useVariablesModel(member.variables)
			}
		}
	}
	private useStaticCacheNode(key: string, node: N.Node) {
		return useNewCacheNode(node, snoc(this.path, key), this.persist)
	}

	private useCacheNode(key: string, variables: Record<string, unknown>): CacheNode {
		if (this.models.hasOwnProperty(key)) {
			const encodedVariables = this.models[key].encode(variables)
			const newEntry = (this.entries[key] as Map<string, CacheNode>).get(encodedVariables)
			if (newEntry) {
				return newEntry
			} else {
				const n = this.useStaticCacheNode(key, this.schemaNode.members[key])
				;(this.entries[key] as Map<string, CacheNode>).set(key, n)
				return n
			}
		}
		return this.entries[key] as CacheNode
	}
	read(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
		return () => {
			const result = Object.create(null)
			for (const key in requestNode.members) {
				const r = this.useCacheNode(key, variables).read(requestNode.members[key], variables)()
				if (isNone(r)) {
					return r
				}
				result[key] = r.value
			}
			return some(result)
		}
	}
	toEntries(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
		return () => {
			const requestEntries = Object.create(null)
			for (const key in requestNode.members) {
				requestEntries[key] = this.useCacheNode(key, variables).toEntries(requestNode.members[key], variables)()
			}
			return requestEntries
		}
	}
	write(variables: Record<string, unknown>, data: Record<string, unknown>) {
		return async () => {
			const evictions: Promise<Evict>[] = []
			for (const key in data) {
				evictions.push(this.useCacheNode(key, variables).write(variables, data[key])())
			}
			return sequenceArrayIO(await Promise.all(evictions))
		}
	}
}

class MapCacheNode extends CacheNode {
	readonly entry = shallowReactive(new Map<unknown, CacheNode>())
	constructor(
		readonly schemaNode: N.MapNode<any, any, any, any, any, any, any, any>,
		readonly path: Path,
		readonly persist?: Persist
	) {
		super(schemaNode, path, persist)
		this.useNode = this.useNode.bind(this)
		this.useCacheNode = this.useCacheNode.bind(this)
		this.writeToNode = this.writeToNode.bind(this)
		this.useEntry = this.useEntry.bind(this)
	}
	private useNode(key: string | number) {
		return useNewCacheNode(this.schemaNode.item, snoc(this.path, key), this.persist)
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
	toEntries(requestNode: N.MapNode<any, any, any, any, any, any, any, any>, variables: Record<string, unknown>) {
		return () => traverseMap(this.useEntry(requestNode.item, variables))(this.entry)
	}
	private useCacheNode(key: unknown): IO<[CacheNode, boolean]> {
		return () => {
			const keyEntry = this.entry.get(key)
			if (keyEntry) {
				return [keyEntry, false]
			}
			const newEntry = this.useNode(key as string | number)
			this.entry.set(key, newEntry)
			return [newEntry as CacheNode, true]
		}
	}
	private writeToNode(variables: Record<string, unknown>) {
		return (key: unknown, data: unknown): CacheWriteResult => {
			return pipe(
				fromIO(this.useCacheNode(key)),
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
	constructor(readonly schemaNode: N.ArrayNode<any, any, any>, readonly path: Path, readonly persist?: Persist) {
		super(schemaNode, path, persist)
		this.useNode = this.useNode.bind(this)
		this.useCacheNode = this.useCacheNode.bind(this)
		this.writeToNode = this.writeToNode.bind(this)
		this.readNode = this.readNode.bind(this)
	}
	private useNode(index: number) {
		return useNewCacheNode(this.schemaNode.item, snoc(this.path, index), this.persist)
	}
	private readNode(requestNode: N.Node, variables: Record<string, unknown>) {
		return (node: CacheNode) => node.read(requestNode, variables)
	}
	read(requestNode: N.ArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return pipe(this.entry, traverseArrayIO(this.readNode(requestNode.item, variables)), mapIO(sequenceArray))
	}
	toEntries(requestNode: N.ArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return () => this.entry.map((n) => n.toEntries(requestNode.item, variables)())
	}
	private useCacheNode(index: number): IO<[CacheNode, boolean]> {
		return () => {
			let isNew = false
			let indexEntry = this.entry[index]
			if (!indexEntry) {
				indexEntry = this.useNode(index)
				this.entry[index] = indexEntry
				isNew = true
			}
			return [indexEntry, isNew]
		}
	}
	private writeToNode(variables: Record<string, unknown>) {
		return (index: number, data: unknown): CacheWriteResult => {
			return pipe(
				fromIO(this.useCacheNode(index)),
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
		readonly schemaNode: N.NonEmptyArrayNode<any, any, any>,
		readonly path: Path,
		readonly persist?: Persist
	) {
		this.cache = new ArrayCacheNode(schemaNode as any, path, persist)
	}
	read(requestNode: N.NonEmptyArrayNode<any, any, any>, variables: Record<string, unknown>) {
		// @ts-ignore
		return pipe(this.cache.read(requestNode, variables), mapT(chain(fromArray)))
	}
	toEntries(requestNode: N.NonEmptyArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return computed(() => fromArray(this.cache.toEntries(requestNode as any, variables)()))
	}
	write(variables: Record<string, unknown>, value: unknown[]) {
		return this.cache.write(variables, value)
	}
}

class OptionCacheNode extends CacheNode {
	readonly entry = shallowRef(none as Option<CacheNode>)
	constructor(readonly schemaNode: N.OptionNode<any, any, any>, readonly path: Path, readonly persist?: Persist) {
		super(schemaNode, path, persist)
	}
	read(requestNode: N.OptionNode<any, any, any>, variables: Record<string, unknown>) {
		return pipe(
			this.entry.value,
			fold(constant(of(none)), (node) => node.read(requestNode.item, variables))
		)
	}
	toEntries(requestNode: N.OptionNode<any, any, any>, variables: Record<string, unknown>) {
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
					const newEntry = useNewCacheNode(this.schemaNode.item, snoc(this.path, 'value'), this.persist)
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
