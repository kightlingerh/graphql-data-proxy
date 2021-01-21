import { IO, of, map as mapIO, traverseArray as traverseArrayIO, sequenceArray as sequenceArrayIO } from 'fp-ts/IO'
import { fromIO, chain as chainT, map as mapT, Task } from 'fp-ts/Task'
import { computed, shallowReactive, shallowRef } from 'vue'
import { isNonEmpty, snoc } from 'fp-ts/Array'
import { left, right } from 'fp-ts/Either'
import { absurd, constant, pipe } from 'fp-ts/function'
import { fromArray } from 'fp-ts/NonEmptyArray'
import { chain, isNone, none, Option, some, sequenceArray, isSome, map as mapO, fold } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { Model } from '../model'
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
	constructor(schemaNode: S, deps: CacheDependencies) {
		this.entry = new TypeCacheNode(schemaNode, deps.id ? [deps.id] : [], deps.persist)
		this.useRead = this.useRead.bind(this)
		this.write = this.write.bind(this)
		this.useToEntries = this.useToEntries.bind(this)
	}
	useRead<R extends N.SchemaNode<any, any>>(
		requestNode: R
	): Reader<N.TypeOfMergedVariables<R>, IO<Option<N.TypeOf<R>>>> {
		return (variables) => this.entry.read(requestNode, variables)
	}
	write<R extends N.SchemaNode<any, any>>(
		variables: N.TypeOfMergedVariables<R>
	): Reader<N.TypeOfPartial<R>, CacheWriteResult> {
		return (data) => this.entry.write(variables, data)
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
	constructor(readonly schemaNode: PrimitiveNode, readonly path: N.Path, readonly persist?: Persist) {
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

const CACHE_NODES: Record<CacheGraphqlNode['tag'], any> = {
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
	// @ts-ignore
	Option: OptionCacheNode,
	Scalar: PrimitiveCacheNode,
	// @ts-ignore
	Sum: SumCacheNode,
	// @ts-ignore
	Type: TypeCacheNode
}

function useNewCacheNode(node: CacheGraphqlNode, path: N.Path, persist?: Persist): CacheNode {
	if (!!node.__isEntity) {
		return new PrimitiveCacheNode(node as PrimitiveNode, path, persist)
	}
	return new CACHE_NODES[node.tag](node, path, persist)
}

class SumCacheNode extends CacheNode {
	readonly entry: N.Ref<Option<[string, CacheNode]>> = shallowRef(none)
	constructor(readonly schemaNode: N.SumNode<any, any, any>, readonly path: N.Path, readonly persist?: Persist) {
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
					useNewCacheNode((this.schemaNode.membersRecord as any)[__typename], this.path, this.persist)
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
	readonly entries: Record<string, CacheNode | Map<string, CacheNode>> = Object.create(null)
	readonly models: Record<string, Model<any, any, any>> = Object.create(null)
	constructor(
		readonly schemaNode: N.TypeNode<any, any, any, any>,
		readonly path: N.Path,
		readonly persist?: Persist
	) {
		super(schemaNode, path, persist)
		for (const key in schemaNode.members) {
			const member: N.Node = schemaNode.members[key]
			const hasVariables = !isEmptyObject(member.variables)
			this.entries[key] = hasVariables
				? new Map()
				: useNewCacheNode(member as CacheGraphqlNode, snoc(path, key), persist)
			if (hasVariables) {
				this.models[key] = N.useVariablesModel(member.variables)
			}
		}
	}

	private useCacheNode(key: string, variables: Record<string, unknown>): CacheNode {
		if (this.models.hasOwnProperty(key)) {
			const encodedVariables = JSON.stringify(this.models[key].encode(variables))
			const newEntry = (this.entries[key] as Map<string, CacheNode>).get(encodedVariables)
			if (newEntry) {
				return newEntry
			} else {
				const n = useNewCacheNode(this.schemaNode.members[key], snoc(this.path, key), this.persist)
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
	useEntries(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
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
		readonly path: N.Path,
		readonly persist?: Persist
	) {
		super(schemaNode, path, persist)
		this.useCacheNode = this.useCacheNode.bind(this)
		this.useWriteToNode = this.useWriteToNode.bind(this)
		this.useEntry = this.useEntry.bind(this)
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
	private useCacheNode(key: unknown): [CacheNode, boolean] {
		const keyEntry = this.entry.get(key)
		if (keyEntry) {
			return [keyEntry, false]
		}
		const newEntry = useNewCacheNode(this.schemaNode.item, snoc(this.path, key as string | number), this.persist)
		this.entry.set(key, newEntry)
		return [newEntry as CacheNode, true]
	}
	private useWriteToNode(variables: Record<string, unknown>) {
		return (key: unknown, data: unknown): CacheWriteResult => {
			return async () => {
				const [node, isNew] = this.useCacheNode(key)
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
	constructor(readonly schemaNode: N.ArrayNode<any, any, any>, readonly path: N.Path, readonly persist?: Persist) {
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
	private useCacheNode(index: number): IO<[CacheNode, boolean]> {
		return () => {
			let isNew = false
			let indexEntry = this.entry[index]
			if (!indexEntry) {
				indexEntry = useNewCacheNode(this.schemaNode.item, snoc(this.path, index), this.persist)
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
		readonly schemaNode: N.NonEmptyArrayNode<any, any, any>,
		readonly path: N.Path,
		readonly persist?: Persist
	) {
		this.cache = new ArrayCacheNode(schemaNode as any, path, persist)
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
	constructor(readonly schemaNode: N.OptionNode<any, any, any>, readonly path: N.Path, readonly persist?: Persist) {
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
