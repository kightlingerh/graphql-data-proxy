import { isNonEmpty, snoc } from 'fp-ts/Array'
import { left, right } from 'fp-ts/Either'
import { absurd, constVoid, Endomorphism, pipe } from 'fp-ts/function'
import { IO, sequenceArray as sequenceArrayIO } from 'fp-ts/IO'
import { fromArray, NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { chain, isNone, isSome, none, Option, some } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { Task } from 'fp-ts/Task'
import { TaskEither } from 'fp-ts/TaskEither'
import { Tree } from 'fp-ts/Tree'
import { computed, shallowReactive, shallowRef } from 'vue'
import { Model } from '../model'
import * as N from '../node'
import { Ref } from '../node'
import { isDev, isEmptyObject } from '../shared'
import { CacheGraphqlNode, isNonPrimitiveEntityNode, PrimitiveNode, traverseMap } from './shared'
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
			if (isDev) {
				const errors = validate(schema, request)
				if (isNonEmpty(errors)) {
					return left<CacheError, Cache<R>>(errors)
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
		this.entry = new TypeCacheNode(schemaNode, deps.id ? [deps.id] : ['root'], new Map(), deps)
		this.useRead = this.useRead.bind(this)
		this.write = this.write.bind(this)
		this.useToEntries = this.useToEntries.bind(this)
		this.applyWrites = this.applyWrites.bind(this)
	}
	useRead<R extends N.SchemaNode<any, any>>(
		requestNode: R
	): Reader<N.TypeOfMergedVariables<R>, IO<Option<N.TypeOf<R>>>> {
		return (variables) => () => this.entry.read(requestNode, variables)
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
					this.pendingWrites.push(() => this.entry.write(variables, data).then(resolve))
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
		return (variables) => () => this.entry.toEntries(requestNode, variables) as N.TypeOfRefs<R>
	}
}

abstract class CacheNode<T extends N.Node> {
	protected constructor(
		protected readonly schemaNode: T,
		protected readonly path: N.Path,
		protected readonly deps: CacheDependencies
	) {}
	abstract read(requestNode: T, variables: Record<string, unknown>): Option<unknown>
	toEntries(requestNode: T, variables: Record<string, unknown>): unknown {
		return isNonPrimitiveEntityNode(requestNode)
			? computed(() => this.read(requestNode, variables))
			: this.useEntries(requestNode, variables)
	}
	abstract useEntries(requestNode: T, variables: Record<string, unknown>): unknown
	abstract write(variables: Record<string, unknown>, data: unknown): Promise<Evict>
}

class PrimitiveCacheNode extends CacheNode<PrimitiveNode> {
	readonly entry = shallowRef(none as Option<unknown>)
	constructor(schemaNode: PrimitiveNode, path: N.Path, deps: CacheDependencies) {
		super(schemaNode, path, deps)
	}
	read() {
		return this.entry.value
	}
	useEntries() {
		return this.entry
	}
	async write(_: Record<string, unknown>, value: unknown) {
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

function useNewCacheNode(
	node: CacheGraphqlNode,
	path: N.Path,
	uniqueNodes: Map<unknown, CacheNode<any>>,
	deps: CacheDependencies
) {
	if (!!node.__isEntity) {
		return new PrimitiveCacheNode(node as PrimitiveNode, path, deps)
	}
	switch (node.tag) {
		case 'Map':
			return new MapCacheNode(node, path, uniqueNodes, deps)
		case 'Option':
			return new OptionCacheNode(node, path, uniqueNodes, deps)
		case 'NonEmptyArray':
			return new NonEmptyArrayCacheNode(node as any, path, uniqueNodes, deps)
		case 'Array':
			return new ArrayCacheNode(node, path, uniqueNodes, deps)
		case 'Sum':
			return new SumCacheNode(node, path, uniqueNodes, deps)
		case 'Type':
			return new TypeCacheNode(node, path, uniqueNodes, deps)
		default:
			return new PrimitiveCacheNode(node as PrimitiveNode, path, deps)
	}
}

class SumCacheNode extends CacheNode<N.SumNode<any, any, any, any>> {
	readonly entry: N.Ref<Option<[string, TypeCacheNode]>> = shallowRef(none)
	constructor(
		schemaNode: N.SumNode<any, any, any>,
		path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		deps: CacheDependencies
	) {
		super(schemaNode, path, deps)
	}

	read(requestNode: N.SumNode<any, any, any, any>, variables: Record<string, unknown>) {
		return isSome(this.entry.value)
			? this.entry.value.value[1].read((requestNode.membersRecord as any)[this.entry.value.value[0]], variables)
			: none
	}
	useEntries(requestNode: N.SumNode<any, any, any, any>, variables: Record<string, unknown>) {
		return computed(() =>
			isSome(this.entry.value)
				? some(
						this.entry.value.value[1].toEntries(
							(requestNode.membersRecord as any)[this.entry.value.value[0]],
							variables
						)
				  )
				: none
		)
	}
	private useNewNode(__typename: string) {
		const newNode = new TypeCacheNode(
			(this.schemaNode.membersRecord as any)[__typename],
			this.path,
			this.uniqueNodes,
			this.deps
		)
		this.entry.value = some([__typename as string, newNode])
		return newNode
	}
	private async setNewValue(
		variables: Record<string, unknown>,
		data: Record<string, unknown>,
		currentValue: Option<[string, TypeCacheNode]>,
		__typename: string
	) {
		const newNode = this.useNewNode(__typename)
		await newNode.write(variables, data)
		return () => {
			if (
				isSome(this.entry.value) &&
				this.entry.value.value[0] === __typename &&
				this.entry.value.value[1] === newNode
			) {
				this.entry.value = currentValue
			}
		}
	}
	async write(variables: Record<string, unknown>, data: Record<string, unknown>) {
		if (isNone(this.entry.value) && data.__typename) {
			return this.setNewValue(variables, data, none, data.__typename as string)
		}
		// check if current value needs to be overwritten
		if (isSome(this.entry.value) && data.__typename && this.entry.value.value[0] !== data.__typename) {
			return this.setNewValue(variables, data, this.entry.value, data.__typename as string)
		}
		if (
			isSome(this.entry.value) &&
			(data.__typename === undefined || data.__typename === this.entry.value.value[0])
		) {
			return this.entry.value.value[1].write(variables, data)
		}
		return absurd as IO<void>
	}
}

class TypeCacheNode extends CacheNode<N.TypeNode<any, any, any, any, any>> {
	private shouldCheckId: boolean
	readonly entry: Ref<Record<string, CacheNode<any> | Map<string, CacheNode<any>>>>
	readonly models: Record<string, Model<any, any, any>> = {}
	constructor(
		schemaNode: N.TypeNode<any, any, any, any, any>,
		path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		deps: CacheDependencies
	) {
		super(schemaNode, path, deps)
		if (schemaNode.__customCache) {
			const id = schemaNode.__customCache.toId(path)
			if (id) {
				this.shouldCheckId = false
				const entry = uniqueNodes.get(id)
				if (entry) {
					this.entry = entry
				} else {
					this.entry = shallowRef(this.buildEntry())
					uniqueNodes.set(id, this.entry)
				}
			} else {
				this.shouldCheckId = true
				this.entry = shallowRef(this.buildEntry())
			}
		} else {
			this.shouldCheckId = false
			this.entry = shallowRef(this.buildEntry())
		}
	}
	private shouldUseDynamicEntry(member: N.Node): boolean {
		const hasVariables = !isEmptyObject(member.variables)
		if (member.tag === 'Map' || member.tag === 'Type') {
			return member.__customCache !== undefined ? false : hasVariables
		}
		return hasVariables
	}
	private buildEntry() {
		const newEntry: any = {}
		for (const key in this.schemaNode.members) {
			const member: N.Node = this.schemaNode.members[key]
			const shouldUseDynamicEntry = this.shouldUseDynamicEntry(member)
			newEntry[key] = shouldUseDynamicEntry
				? new Map()
				: useNewCacheNode(member as CacheGraphqlNode, snoc(this.path, key), this.uniqueNodes, this.deps)
			if (shouldUseDynamicEntry) {
				this.models[key] = N.useVariablesModel(member.variables)
			}
		}
		return newEntry
	}
	private useEntry(variables?: Record<string, unknown>, data?: Record<string, unknown>) {
		if (this.shouldCheckId && this.schemaNode.__customCache) {
			const customCache = this.schemaNode.__customCache
			const id = customCache.toId(this.path, variables, data)
			if (id === null || id === undefined) {
				return this.entry.value
			} else {
				this.shouldCheckId = false
				let newEntry = this.uniqueNodes.get(id)
				if (newEntry) {
					if (newEntry !== this.entry.value) {
						this.entry.value = newEntry
					}
					return newEntry
				}
				this.uniqueNodes.set(id, this.entry.value)
				return this.entry.value
			}
		}
		return this.entry.value
	}
	private useCacheNode(
		entry: Record<string, CacheNode<any> | Map<string, CacheNode<any>>>,
		key: string,
		variables: Record<string, unknown>
	): CacheNode<any> {
		if (this.models.hasOwnProperty(key)) {
			const encodedVariables = JSON.stringify(this.models[key].encode(variables))
			const newEntry = (entry[key] as Map<string, CacheNode<any>>).get(encodedVariables)
			if (newEntry) {
				return newEntry
			} else {
				const n = useNewCacheNode(
					this.schemaNode.members[key],
					[...this.path, encodedVariables, key] as N.Path,
					this.uniqueNodes,
					this.deps
				) as CacheNode<any>
				;(entry[key] as Map<string, CacheNode<any>>).set(encodedVariables, n)
				return n
			}
		}
		return entry[key] as CacheNode<any>
	}
	read(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
		const result: any = {}
		const entry = this.useEntry(variables)
		for (const key in requestNode.members) {
			const r = this.useCacheNode(entry, key, variables).read(requestNode.members[key], variables)
			if (isNone(r)) {
				return none
			}
			result[key] = r.value
		}
		return some(result)
	}
	useEntries(requestNode: N.TypeNode<any, any, any, any>, variables: Record<string, unknown>) {
		const requestEntries: any = {}
		const entry = this.useEntry(variables)
		for (const key in requestNode.members) {
			const node = this.useCacheNode(entry, key, variables)
			requestEntries[key] = node.toEntries(requestNode.members[key], variables)
		}
		return requestEntries
	}
	async write(variables: Record<string, unknown>, data: Record<string, unknown>) {
		const evictions: Promise<Evict>[] = []
		const entry = this.useEntry(variables, data)
		for (const key in data) {
			evictions.push(this.useCacheNode(entry, key, variables).write(variables, data[key]))
		}
		return sequenceArrayIO(await Promise.all(evictions))
	}
}

class MapCacheNode extends CacheNode<N.MapNode<any, any, any, any, any, any, any, any, any>> {
	private shouldCheckId: boolean = true
	readonly entry: Map<unknown, any>
	constructor(
		schemaNode: N.MapNode<any, any, any, any, any, any>,
		path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		deps: CacheDependencies
	) {
		super(schemaNode, path, deps)
		if (this.schemaNode.__customCache) {
			const id = this.schemaNode.__customCache.toId(this.path)
			if (id) {
				this.shouldCheckId = false
				let entry = this.uniqueNodes.get(id)
				if (entry) {
					this.entry = entry
				} else {
					const newEntry = shallowReactive(new Map())
					this.uniqueNodes.set(id, newEntry)
					this.entry = newEntry
				}
			} else {
				this.entry = shallowReactive(new Map())
			}
		} else {
			this.shouldCheckId = false
			this.entry = shallowReactive(new Map())
		}
	}
	private useEntry(variables?: Record<string, unknown>, data?: Map<unknown, unknown>) {
		if (this.shouldCheckId && this.schemaNode.__customCache) {
			const id = this.schemaNode.__customCache.toId(this.path, variables, data)
			if (id) {
				this.shouldCheckId = false
				let entry = this.uniqueNodes.get(id)
				if (entry && entry !== this.entry) {
					// copy entry
					this.entry.clear()
					for (const [key, value] of entry.entries()) {
						this.entry.set(key, value)
					}
				} else {
					this.uniqueNodes.set(id, this.entry)
				}
			}
		}
		return this.entry
	}
	read(requestNode: N.MapNode<any, any, any, any, any, any, any, any>, variables: Record<string, unknown>) {
		const newMap = new Map<unknown, unknown>()
		for (const [key, value] of this.useEntry(variables).entries()) {
			const readValue = value.read(requestNode.item, variables)
			if (isNone(readValue)) {
				return none
			}
			newMap.set(key, readValue.value)
		}
		return some(newMap)
	}
	private useNodeEntries(requestNode: N.Node, variables: Record<string, unknown>) {
		return (node: CacheNode<any>) => node.toEntries(requestNode, variables)
	}
	useEntries(requestNode: N.MapNode<any, any, any, any, any, any, any, any>, variables: Record<string, unknown>) {
		return traverseMap(this.useNodeEntries(requestNode.item, variables))(this.useEntry(variables))
	}
	private useCacheNode(key: unknown, variables?: Record<string, unknown>): [CacheNode<any>, boolean] {
		const keyEntry = this.useEntry(variables).get(key)
		if (keyEntry) {
			return [keyEntry, false]
		}
		const newEntry = useNewCacheNode(
			this.schemaNode.item,
			snoc(this.path, key as string | number),
			this.uniqueNodes,
			this.deps
		) as CacheNode<any>
		this.useEntry().set(key, newEntry)
		return [newEntry as CacheNode<any>, true]
	}
	private useWriteToNode(variables: Record<string, unknown>) {
		const entry = this.useEntry(variables)
		return async (key: unknown, data: unknown) => {
			const [node, isNew] = this.useCacheNode(key, variables)
			if (data === null || data === undefined) {
				if (isNew) {
					// there is already no data at this key, so nothing to evict
					return constVoid
				}
				entry.delete(key)
				return () => {
					if (!this.entry.has(key)) {
						this.entry.set(key, node)
					}
				}
			}
			if (isNew) {
				await node.write(variables, data)
				return () => {
					this.entry.delete(key)
				}
			}
			return node.write(variables, data)
		}
	}
	async write(variables: Record<string, unknown>, data: Map<unknown, unknown>) {
		const _write = this.useWriteToNode(variables)
		const evictions: Promise<Evict>[] = []
		let iteration = 0
		for (const [key, value] of data.entries()) {
			evictions.push(_write(key, value))
			// give main thread a break every 100 writes
			if (iteration % 100 === 0) {
				await Promise.resolve()
			}
			iteration++
		}
		return sequenceArrayIO(await Promise.all(evictions))
	}
}

class ArrayCacheNode extends CacheNode<N.ArrayNode<any, any, any, any>> {
	readonly entry = shallowReactive([] as CacheNode<any>[])
	constructor(
		schemaNode: N.ArrayNode<any, any, any, any>,
		path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		deps: CacheDependencies
	) {
		super(schemaNode, path, deps)
		this.useCacheNode = this.useCacheNode.bind(this)
		this.writeToNode = this.writeToNode.bind(this)
		this.readNode = this.readNode.bind(this)
	}
	private readNode(requestNode: N.Node, variables: Record<string, unknown>) {
		return (node: CacheNode<any>) => node.read(requestNode, variables)
	}
	read(requestNode: N.ArrayNode<any, any, any>, variables: Record<string, unknown>) {
		const result = []
		const length = this.entry.length
		const read = this.readNode(requestNode.item, variables)
		for (let i = 0; i < length; i++) {
			const r = read(this.entry[i])
			if (isNone(r)) {
				return none
			}
			result.push(r.value)
		}
		return some(result)
	}
	useEntries(requestNode: N.ArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return this.entry.map((n) => n.toEntries(requestNode.item, variables))
	}
	private useCacheNode(index: number): [CacheNode<any>, boolean] {
		let isNew = false
		let indexEntry = this.entry[index]
		if (!indexEntry) {
			indexEntry = useNewCacheNode(
				this.schemaNode.item,
				snoc(this.path, index),
				this.uniqueNodes,
				this.deps
			) as CacheNode<any>
			this.entry[index] = indexEntry
			isNew = true
		}
		return [indexEntry, isNew]
	}
	private writeToNode(variables: Record<string, unknown>) {
		return async (index: number, data: unknown) => {
			if (data === null || data === undefined) {
				const [cv] = this.entry.splice(index, 1)
				const newLength = this.entry.length
				return () => {
					if (this.entry.length === newLength) {
						this.entry.splice(index, 0, cv)
					}
				}
			}
			const [node, isNew] = this.useCacheNode(index)
			if (isNew) {
				await node.write(variables, data)
				return () => {
					if (this.entry[index] !== undefined) {
						this.entry.splice(index, 1)
					}
				}
			}
			return node.write(variables, data)
		}
	}
	async write(variables: Record<string, unknown>, data: unknown[]) {
		if (!!this.deps.useImmutableArrays) {
			this.entry.length = data.length
		}
		const _write = this.writeToNode(variables)
		const length = data.length
		const evictions: Promise<IO<void>>[] = []
		for (let i = 0; i < length; i++) {
			evictions.push(_write(i, data[i]))
			// give main thread a break every 100 writes
			if (i % 100 === 0) {
				await Promise.resolve()
			}
		}
		return sequenceArrayIO(await Promise.all(evictions))
	}
}

class NonEmptyArrayCacheNode {
	readonly cache: ArrayCacheNode
	constructor(
		readonly schemaNode: N.NonEmptyArrayNode<any, any, any, any>,
		readonly path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		readonly deps: CacheDependencies
	) {
		this.cache = new ArrayCacheNode(schemaNode as any, path, uniqueNodes, deps)
	}
	read(requestNode: N.NonEmptyArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return pipe(this.cache.read(requestNode as any, variables), chain(fromArray))
	}
	toEntries(requestNode: N.NonEmptyArrayNode<any, any, any>, variables: Record<string, unknown>) {
		return computed(() => fromArray(this.cache.toEntries(requestNode as any, variables) as unknown[]))
	}
	write(variables: Record<string, unknown>, value: unknown[]) {
		return this.cache.write(variables, value)
	}
}

class OptionCacheNode extends CacheNode<N.OptionNode<any, any, any, any>> {
	readonly isSome = shallowRef(false)
	readonly entry: CacheNode<any>
	constructor(
		schemaNode: N.OptionNode<any, any, any>,
		path: N.Path,
		readonly uniqueNodes: Map<unknown, any>,
		deps: CacheDependencies
	) {
		super(schemaNode, path, deps)
		this.entry = useNewCacheNode(schemaNode.item, snoc(path, 'value'), uniqueNodes, deps) as CacheNode<any>
	}
	read(requestNode: N.OptionNode<any, any, any>, variables: Record<string, unknown>) {
		return this.isSome.value ? some(this.entry.read(requestNode.item, variables)) : none
	}
	useEntries(requestNode: N.OptionNode<any, any, any>, variables: Record<string, unknown>) {
		return computed(() => {
			return this.isSome.value ? some(this.entry.toEntries(requestNode.item, variables)) : none
		})
	}

	async write(variables: Record<string, unknown>, data: Option<unknown>) {
		const isCurrentlySome = this.isSome.value
		if (isSome(data)) {
			this.isSome.value = true
			if (!isCurrentlySome) {
				const evict = await this.entry.write(variables, data.value as any)
				return () => {
					if (this.isSome.value) {
						this.isSome.value = false
						evict()
					}
				}
			}
			return this.entry.write(variables, data.value)
		} else {
			this.isSome.value = false
			return () => {
				if (!this.isSome.value) {
					this.isSome.value = true
				}
			}
		}
	}
}
