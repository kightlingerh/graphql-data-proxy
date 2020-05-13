import { sequenceT } from 'fp-ts/lib/Apply'
import {isNonEmpty} from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either'
import {constant} from 'fp-ts/lib/function'
import { IO } from 'fp-ts/lib/IO'
import { Monoid } from 'fp-ts/lib/Monoid'
import { getSemigroup, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { fromCompare } from 'fp-ts/lib/Ord'
import { pipe } from 'fp-ts/lib/pipeable'
import { Reader } from 'fp-ts/lib/Reader'
import { sequence, traverse } from 'fp-ts/lib/Record'
import * as A from 'fp-ts/lib/Array'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { Tree } from 'fp-ts/lib/Tree'
import { ExtractRefType } from '../document/DocumentNode'
import * as D from '../document/DocumentNode'
import * as M from '../model/Model'
import * as MAP from 'fp-ts/lib/Map'
import { isEmptyObject, Ref } from '../shared'

export type CacheNode<T = D.Node> = T & Proxy<T>

export interface Proxy<T> {
	readonly data: Reader<DataProxyDependencies<T>, DataProxy<T>>
	readonly store: Reader<StoreProxyDependencies<T>, StoreProxy<T>>
}

export interface DataProxy<N> {
	write(variables: ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheWriteResult>
	read(variables: ExtractMergedVariablesType<N>): CacheResult<O.Option<D.ExtractModelType<N>>>
	toRefs(variables: ExtractMergedVariablesType<N>): CacheResult<D.ExtractRefType<N>>
	toRef(variables: ExtractMergedVariablesType<N>): CacheResult<Ref<D.ExtractModelType<N>>>
}

export interface StoreProxy<N> {
	write(variables: ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheResult<Evict>>
	read(variables: ExtractMergedVariablesType<N>): CacheResult<O.Option<D.ExtractModelType<N>>>
	toRefs(variables: ExtractMergedVariablesType<N>): CacheResult<D.ExtractRefType<N>>
	toRef(variables: ExtractMergedVariablesType<N>): CacheResult<Ref<D.ExtractModelType<N>>>
}

export interface CacheWriteResult extends CacheResult<Evict> {}

export interface CacheResult<T> extends TE.TaskEither<CacheError, T> {}

export interface Evict extends T.Task<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export type ExtractMergedVariablesType<S> = S extends D.Node
	? keyof D.ExtractChildrenVariablesDefinition<S> extends never
		? D.ExtractVariablesType<S>
		: D.ExtractVariablesType<S> & D.ExtractChildrenVariablesType<S>
	: never

interface DataProxyDependencies<T> extends CacheDependencies {
	node?: T
}

interface StoreProxyDependencies<T> extends CacheDependencies {
	data?: Reader<DataProxyDependencies<T>, DataProxy<T>>
	node?: T
}

export interface CacheDependencies {
	path: string
	ofRef: OfRef
	persist?: Persist
}

export interface OfRef {
	<T>(value?: T): Ref<T>
}

export interface Persist {
	store(key: string, value: string): TE.TaskEither<CacheError, void>
	restore<T>(key: string): TE.TaskEither<CacheError, O.Option<T>>
}

export type ExtractDataProxyType<T> = T extends CacheNode<infer A> ? DataProxy<A> : never

export type ExtractStoreProxyType<T> = T extends CacheNode<infer A> ? StoreProxy<A> : never

const cacheErrorApplicativeValidation = TE.getTaskValidation(getSemigroup<Tree<string>>())

const cacheWriteResultMonoid: Monoid<CacheWriteResult> = {
	empty: TE.right(taskVoid),
	concat: (x, y) => {
		return (async () => {
			const [xResult, yResult] = await Promise.all([x(), y()])
			if (E.isLeft(xResult) && E.isLeft(yResult)) {
				return E.left([...xResult.left, ...yResult.left] as CacheError)
			} else if (E.isLeft(xResult) && E.isRight(yResult)) {
				yResult.right()
				return xResult
			} else if (E.isLeft(yResult) && E.isRight(xResult)) {
				xResult.right()
				return yResult
			} else if (E.isRight(xResult) && E.isRight(yResult)) {
				return E.right(async () => {
					await Promise.all([x(), y()])
				})
			} else {
				return cacheWriteResultMonoid.empty
			}
		}) as CacheWriteResult
	}
}

async function taskVoid() {}

function concatEvict(x: Evict, y: Evict): Evict {
	return async () => {
		await Promise.all([x(), y()])
	}
}

class Store<T extends D.Node> implements StoreProxy<T> {
	protected readonly proxyMap: Map<unknown, DataProxy<T>> = new Map()

	constructor(
		protected readonly deps: Pick<StoreProxyDependencies<T>, 'persist'> &
			Required<Omit<StoreProxyDependencies<T>, 'persist'>>
	) {
		this.read.bind(this)
		this.write.bind(this)
		this.toRef.bind(this)
		this.toRefs.bind(this)
	}

	read(variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> {
		return this.extractProxy(this.encodeVariables(variables)).read(variables)
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheResult<Evict>> {
		return this.extractProxy(this.encodeVariables(variables)).write(variables)
	}

	toRef(variables: ExtractMergedVariablesType<T>): CacheResult<Ref<D.ExtractModelType<T>>> {
		return this.extractProxy(this.encodeVariables(variables)).toRef(variables)
	}

	toRefs(variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> {
		return this.extractProxy(this.encodeVariables(variables)).toRefs(variables)
	}

	protected extractProxy(encodedVariables: unknown): DataProxy<T> {
		const proxy = this.proxyMap.get(encodedVariables)
		if (proxy) {
			return proxy
		} else {
			const newProxy = this.make(encodedVariables as string)
			this.proxyMap.set(encodedVariables, newProxy)
			return newProxy
		}
	}

	protected make(path: string): DataProxy<T> {
		return this.deps.data({
			...this.deps,
			path: `${this.deps.path}-${path}`
		})
	}

	protected encodeVariables(variables: ExtractMergedVariablesType<T>): unknown {
		return this.deps.node.variables.model.encode(variables)
	}
}

class LiteralProxy<T, V extends D.VariablesNode = {}>
	implements DataProxy<D.DocumentNode<T, T, Ref<T>, V>> {
	readonly ref: Ref<T>
	constructor(private readonly deps: DataProxyDependencies<D.DocumentNode<T, T, Ref<T>, V>>) {
		this.ref = this.deps.ofRef()
		this.read.bind(this)
		this.write.bind(this)
		this.toRef.bind(this)
		this.toRefs.bind(this)
	}

	read(): CacheResult<O.Option<T>> {
		return TE.rightIO(() => this.ref.value)
	}

	write(): Reader<T, CacheResult<Evict>> {
		return (num) =>
			pipe(
				this.read(),
				TE.chain((previousValue) => {
					const newValue = O.some(num)
					return pipe(
						TE.rightIO(() => {
							this.ref.value = newValue
						}),
						TE.apSecond(this.read()),
						TE.map((currentValue) => {
							return T.fromIO(() => {
								if (newValue === currentValue) {
									this.ref.value = previousValue
								}
							})
						})
					)
				})
			)
	}

	toRef(): CacheResult<Ref<T>> {
		return TE.rightIO(() => this.ref)
	}

	toRefs(): CacheResult<Ref<T>> {
		return this.toRef()
	}
}

export function number<V extends D.VariablesNode = {}>(variables: V): CacheNode<D.NumberNode<V>> {
	const node = D.number(variables)
	const data = (deps: DataProxyDependencies<D.NumberNode<V>>) => new LiteralProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

export function string<V extends D.VariablesNode = {}>(variables: V): CacheNode<D.StringNode<V>> {
	const node = D.string(variables)
	const data = (deps: DataProxyDependencies<D.StringNode<V>>) => new LiteralProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

export function boolean<V extends D.VariablesNode = {}>(variables: V): CacheNode<D.BooleanNode<V>> {
	const node = D.boolean(variables)
	const data = (deps: DataProxyDependencies<D.BooleanNode<V>>) => new LiteralProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

export function scalar<N extends string, T, V extends D.VariablesNode = {}>(
	name: N,
	model: M.Model<T>,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.ScalarNode<N, T, V>> {
	const node = D.scalar(name, model, variables)
	const data = (deps: DataProxyDependencies<D.ScalarNode<N, T, V>>) => new LiteralProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

const recordTraverse = traverse(cacheErrorApplicativeValidation)

abstract class BaseProxy<T extends D.Node>
	implements DataProxy<T>
{
	protected constructor(protected readonly deps: Pick<DataProxyDependencies<T>, 'persist'> &
		Required<Omit<DataProxyDependencies<T>, 'persist'>>
	) {
		this.read.bind(this)
		this.write.bind(this)
		this.toRef.bind(this)
		this.toRefs.bind(this)
	}
	abstract read(variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>>
	abstract write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheWriteResult>
	abstract toRefs(variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>>

	toRef(variables: ExtractMergedVariablesType<T>): CacheResult<Ref<D.ExtractModelType<T>>> {
		return pipe(variables, this.read, TE.map((o) => (O.isSome(o) ? this.deps.ofRef(o.value) : this.deps.ofRef())))
	}
}


class TypeProxy<N extends string, T extends { [K in keyof T]: CacheNode }, V extends D.VariablesNode = {}>
	extends BaseProxy<D.TypeNode<N, T, V>> {
	readonly proxy: { [K in keyof T]: ExtractStoreProxyType<T[K]> }
	constructor(
		deps: Pick<DataProxyDependencies<D.TypeNode<N, T, V>>, 'persist'> &
			Required<Omit<DataProxyDependencies<D.TypeNode<N, T, V>>, 'persist'>>
	) {
		super(deps)
		this.proxy = this.getProxy()
	}
	read(
		variables: D.ExtractChildrenVariablesType<D.TypeNode<N, T, V>>
	): CacheResult<O.Option<D.ExtractModelType<D.TypeNode<N, T, V>>>> {
		return pipe(
			this.proxy as Record<keyof T, StoreProxy<any>>,
			recordTraverse((m) => m.read(variables as any)),
			TE.map(sequence(O.option))
		) as CacheResult<O.Option<D.ExtractModelType<D.TypeNode<N, T, V>>>>
	}

	write(
		variables: D.ExtractChildrenVariablesType<D.TypeNode<N, T, V>>
	): Reader<D.ExtractPartialModelType<D.TypeNode<N, T, V>>, CacheWriteResult> {
		return (data) => {
			let proxyWrite: CacheWriteResult = cacheWriteResultMonoid.empty
			for (const key in this.proxy) {
				if (data[key]) {
					proxyWrite = cacheWriteResultMonoid.concat(
						proxyWrite,
						this.proxy[key].write(variables as any)(data[key])
					)
				}
			}
			return proxyWrite
		}
	}
	toRefs(
		variables: D.ExtractChildrenVariablesType<D.TypeNode<N, T, V>>
	): CacheResult<Ref<{ [K in keyof T]: D.ExtractRefType<T[K]> }>> {
		return pipe(
			this.proxy as Record<keyof T, StoreProxy<any>>,
			recordTraverse((m) => m.toRefs(variables as any)),
			TE.map(this.deps.ofRef)
		) as CacheResult<Ref<{ [K in keyof T]: D.ExtractRefType<T[K]> }>>
	}

	private getProxy() {
		const proxy: Partial<{ [K in keyof T]: ExtractStoreProxyType<T[K]> }> = {}
		const members = this.deps.node.members
		for (const key in members) {
			const member = members[key]
			proxy[key] = member.store({
				...this.deps,
				path: `${this.deps.path}.${this.deps.node.__typename}.${key}`,
				node: member
			}) as any
		}
		return proxy as { [K in keyof T]: ExtractStoreProxyType<T[K]> }
	}
}

export function type<N extends string, T extends { [K in keyof T]: CacheNode }, V extends D.VariablesNode = {}>(
	__typename: N,
	members: T,
	variables: V
): CacheNode<D.TypeNode<N, T, V>> {
	const node = D.type(__typename, members, variables)
	const data = (deps: DataProxyDependencies<D.TypeNode<N, T, V>>) => new TypeProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

const withMap = MAP.getWitherable(fromCompare(constant(0)))

const traverseMapCacheResult = withMap.traverse(cacheErrorApplicativeValidation)

const traverseWithIndexMapCacheResult = withMap.traverseWithIndex(cacheErrorApplicativeValidation as any)

const sequenceMapOption = withMap.sequence(O.option)

class MapProxy<K extends D.Node, T extends CacheNode, V extends D.VariablesNode = {}>
	extends BaseProxy<D.MapNode<K, T, V>> {
	readonly proxy: Map<D.ExtractModelType<K>, StoreProxy<T>> = new Map()
	constructor(
		deps: Pick<DataProxyDependencies<D.MapNode<K, T, V>>, 'persist'> &
			Required<Omit<DataProxyDependencies<D.MapNode<K, T, V>>, 'persist'>>
	) {
		super(deps)
	}

	read(
		variables: ExtractMergedVariablesType<D.MapNode<K, T, V>>
	): CacheResult<O.Option<D.ExtractModelType<D.MapNode<K, T, V>>>> {
		return pipe(
			traverseMapCacheResult(this.proxy, (m) => m.read(variables as any)),
			TE.map(sequenceMapOption)
		) as CacheResult<O.Option<D.ExtractModelType<D.MapNode<K, T, V>>>>
	}

	write(
		variables: ExtractMergedVariablesType<D.MapNode<K, T, V>>
	): Reader<D.ExtractPartialModelType<D.MapNode<K, T, V>>, CacheWriteResult> {
		return (data) => {
			return traverseWithIndexMapCacheResult<
				D.ExtractPartialModelType<T>,
				D.ExtractModelType<K>,
				CacheError,
				Evict
			>(
				data as Map<unknown, D.ExtractPartialModelType<T>>,
				((k: D.ExtractModelType<K>, v: D.ExtractPartialModelType<T>) => {
					return pipe(
						TE.rightIO(this.getProxy(k as D.ExtractModelType<K>)),
						TE.chain((p) => p.write(variables as any)(v))
					)
				}) as any
			)
		}
	}

	toRefs(
		variables: ExtractMergedVariablesType<D.MapNode<K, T, V>>
	): CacheResult<Ref<Map<unknown, ExtractRefType<T>>>> {
		return pipe(
			traverseMapCacheResult(this.proxy, (m) => m.toRefs(variables as any)),
			TE.map(this.deps.ofRef)
		)
	}

	private getProxy(key: D.ExtractModelType<K>): IO<StoreProxy<T>> {
		return () => {
			const kProxy = this.proxy.get(key)
			if (kProxy) {
				return kProxy
			} else {
				const newProxy = this.deps.node.wrapped.store({
					...this.deps,
					path: `${this.deps.path}-${JSON.stringify(key)}`,
					node: this.deps.node.wrapped
				})
				this.proxy.set(key, newProxy)
				return newProxy
			}
		}
	}
}

export function map<K extends D.Node, T extends CacheNode, V extends D.VariablesNode = {}>(
	key: K,
	value: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.MapNode<K, T, V>> {
	const node = D.map(key, value, variables)
	const data = (deps: DataProxyDependencies<D.MapNode<K, T, V>>) => new MapProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

class ArrayProxy<T extends CacheNode, V extends D.VariablesNode = {}> extends BaseProxy<D.ArrayNode<T, V>> {
	proxy: StoreProxy<T>[] = []
	constructor(
		deps: Pick<DataProxyDependencies<D.ArrayNode<T, V>>, 'persist'> &
			Required<Omit<DataProxyDependencies<D.ArrayNode<T, V>>, 'persist'>>
	) {
		super(deps)
	}

	read(
		variables: ExtractMergedVariablesType<D.ArrayNode<T, V>>
	): CacheResult<O.Option<D.ExtractModelType<D.ArrayNode<T, V>>>> {
		return pipe(
			A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) => m.read(variables as any)),
			TE.map(A.array.sequence(O.option))
		)
	}

	write(
		variables: ExtractMergedVariablesType<D.ArrayNode<T, V>>
	): Reader<D.ExtractPartialModelType<D.ArrayNode<T, V>>, CacheWriteResult> {
		return (data) => {
			return pipe(
				TE.rightIO(this.getProxy(data)),
				TE.chain((proxy) =>
					A.array.traverseWithIndex(cacheErrorApplicativeValidation)(proxy, (i, a) => {
						return a.write(variables as any)(data[i])
					})
				),
				TE.map(A.reduce(taskVoid, concatEvict))
			)
		}
	}

	toRefs(variables: ExtractMergedVariablesType<D.ArrayNode<T, V>>): CacheResult<Ref<ExtractRefType<T>[]>> {
		return pipe(
			A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) => m.toRefs(variables as any)),
			TE.map(this.deps.ofRef)
		)
	}

	private getProxy(data: D.ExtractPartialModelType<D.ArrayNode<T, V>>): IO<StoreProxy<T>[]> {
		return () => {
			const newProxy = data.map((_, index) =>
				this.deps.node.wrapped.store({
					...this.deps,
					path: `${this.deps.path}[${index}]`,
					node: this.deps.node.wrapped
				})
			)
			this.proxy = newProxy
			return newProxy
		}
	}
}

export function array<T extends CacheNode, V extends D.VariablesNode = {}>(
	wrapped: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.ArrayNode<T, V>> {
	const node = D.array(wrapped, variables)
	const data = (deps: DataProxyDependencies<D.ArrayNode<T, V>>) => new ArrayProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

class SumProxy<T extends { [K in keyof T]: CacheNode<D.TypeNode<string, any>> }, V extends D.VariablesNode = {}>
	extends BaseProxy<D.SumNode<T, V>> {
	proxy: O.Option<{ [K in keyof T]: StoreProxy<T[K]> }[keyof T]> = O.none
	constructor(
		deps: Pick<DataProxyDependencies<D.SumNode<T, V>>, 'persist'> &
			Required<Omit<DataProxyDependencies<D.SumNode<T, V>>, 'persist'>>
	) { super(deps) }

	read(
		variables: ExtractMergedVariablesType<D.SumNode<T, V>>
	): CacheResult<O.Option<D.ExtractModelType<D.SumNode<T, V>>>> {
		return pipe(
			this.proxy,
			O.fold(constant(TE.right(O.none)), (p) => p.read(variables as any))
		)
	}

	write(
		variables: ExtractMergedVariablesType<D.SumNode<T, V>>
	): Reader<D.ExtractPartialModelType<D.SumNode<T, V>>, CacheWriteResult> {
		return (data) => {
			return pipe(
				TE.rightIO(this.getProxy(data)),
				TE.chain(O.fold(constant(TE.right(taskVoid)), (p) => p.write(variables as any)(data)))
			)
		}
	}

	toRefs(variables: ExtractMergedVariablesType<D.SumNode<T, V>>): CacheResult<D.ExtractRefType<D.SumNode<T, V>>> {
		return pipe(
			this.proxy,
			O.fold(constant(TE.right(this.deps.ofRef())), (p) =>
				pipe(p.toRefs(variables as any), TE.map(this.deps.ofRef))
			)
		)
	}

	private getProxy(
		data: D.ExtractPartialModelType<D.SumNode<T, V>>
	): IO<O.Option<{ [K in keyof T]: StoreProxy<T[K]> }[keyof T]>> {
		return () => {
			const members = this.deps.node.members
			for (const k in members) {
				const member = members[k]
				if (member.model.partial.is(data)) {
					const newProxy = O.some(
						member.store({ ...this.deps, path: `${this.deps.path}-${k}`, node: member })
					)
					this.proxy = newProxy
					return newProxy
				}
			}
			return this.proxy
		}
	}
}

const optionSequenceT = sequenceT(O.option)

export function sum<T extends { [K in keyof T]: CacheNode<D.TypeNode<string, any>> }, V extends D.VariablesNode = {}>(
	members: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.SumNode<T, V>> {
	const node = D.sum(members, variables)
	const data = (deps: DataProxyDependencies<D.SumNode<T, V>>) => new SumProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

class OptionProxy<T extends CacheNode, V extends D.VariablesNode = {}> extends BaseProxy<D.OptionNode<T, V>> {
	proxy: O.Option<StoreProxy<T>> = O.none
	constructor(
		deps: Pick<DataProxyDependencies<D.OptionNode<T, V>>, 'persist'> &
			Required<Omit<DataProxyDependencies<D.OptionNode<T, V>>, 'persist'>>
	) { super(deps) }

	read(
		variables: ExtractMergedVariablesType<D.OptionNode<T, V>>
	): CacheResult<O.Option<D.ExtractModelType<D.OptionNode<T, V>>>> {
		return pipe(
			this.proxy,
			O.fold(constant(TE.right(O.none)), (p) => p.read(variables as any))
		)
	}

	write(
		variables: ExtractMergedVariablesType<D.OptionNode<T, V>>
	): Reader<D.ExtractPartialModelType<D.OptionNode<T, V>>, CacheWriteResult> {
		return (data) => {
			return pipe(
				TE.rightIO(this.getProxy(data)),
				TE.chain((oProxy) =>
					pipe(
						optionSequenceT(oProxy, data),
						O.fold(constant(TE.right(taskVoid)), ([proxy, data]) => proxy.write(variables as any)(data))
					)
				)
			)
		}
	}

	toRefs(variables: ExtractMergedVariablesType<D.OptionNode<T, V>>): CacheResult<D.ExtractRefType<D.OptionNode<T, V>>> {
		return pipe(
			this.proxy,
			O.fold(constant(TE.right(this.deps.ofRef())), (p) =>
				pipe(p.toRefs(variables as any), TE.map(O.some), TE.map(this.deps.ofRef))
			)
		)
	}

	private getProxy(data: D.ExtractPartialModelType<D.OptionNode<T, V>>): IO<O.Option<StoreProxy<T>>> {
		return () => {
			if (O.isSome(data) && O.isSome(this.proxy)) {
				return this.proxy
			} else if (O.isSome(data) && O.isNone(this.proxy)) {
				const newProxy = O.some(
					this.deps.node.wrapped.store({
						...this.deps,
						path: `${this.deps.path}.value`,
						node: this.deps.node.wrapped
					})
				)
				this.proxy = newProxy
				return newProxy
			} else if (O.isSome(this.proxy) && O.isNone(data)) {
				this.proxy = O.none
				return O.none
			} else {
				return O.none
			}
		}
	}
}

export function option<T extends CacheNode, V extends D.VariablesNode = {}>(
	wrapped: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.OptionNode<T, V>> {
	const node = D.option(wrapped, variables)
	const data = (deps: DataProxyDependencies<D.OptionNode<T, V>>) => new OptionProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

class NonEmptyArrayProxy<T extends CacheNode, V extends D.VariablesNode = {}> extends BaseProxy<D.NonEmptyArrayNode<T, V>> {
	proxy: StoreProxy<T>[] = []
	constructor(
		deps: Pick<DataProxyDependencies<D.NonEmptyArrayNode<T, V>>, 'persist'> &
			Required<Omit<DataProxyDependencies<D.NonEmptyArrayNode<T, V>>, 'persist'>>
	) { super(deps) }

	read(
		variables: ExtractMergedVariablesType<D.NonEmptyArrayNode<T, V>>
	): CacheResult<O.Option<D.ExtractModelType<D.NonEmptyArrayNode<T, V>>>> {
		return pipe(
			A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) => m.read(variables as any)),
			TE.map(results => pipe(results, A.array.sequence(O.option), O.chain(value => isNonEmpty(value) ? O.some(value) : O.none)))
		)
	}

	write(
		variables: ExtractMergedVariablesType<D.NonEmptyArrayNode<T, V>>
	): Reader<D.ExtractPartialModelType<D.NonEmptyArrayNode<T, V>>, CacheWriteResult> {
		return (data) => {
			return pipe(
				TE.rightIO(this.getProxy(data)),
				TE.chain((proxy) =>
					A.array.traverseWithIndex(cacheErrorApplicativeValidation)(proxy, (i, a) => {
						return a.write(variables as any)(data[i])
					})
				),
				TE.map(A.reduce(taskVoid, concatEvict))
			)
		}
	}

	toRefs(variables: ExtractMergedVariablesType<D.ArrayNode<T, V>>): CacheResult<Ref<NonEmptyArray<ExtractRefType<T>>>> {
		return pipe(
			A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) => m.toRefs(variables as any)),
			TE.map(val => isNonEmpty(val) ? this.deps.ofRef(val) : this.deps.ofRef())
		)
	}

	private getProxy(data: D.ExtractPartialModelType<D.ArrayNode<T, V>>): IO<StoreProxy<T>[]> {
		return () => {
			const newProxy = data.map((_, index) =>
				this.deps.node.wrapped.store({
					...this.deps,
					path: `${this.deps.path}[${index}]`,
					node: this.deps.node.wrapped
				})
			)
			this.proxy = newProxy
			return newProxy
		}
	}
}

export function nonEmptyArray<T extends CacheNode, V extends D.VariablesNode = {}>(
	wrapped: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.NonEmptyArrayNode<T, V>> {
	const node = D.nonEmptyArray(wrapped, variables)
	const data = (deps: DataProxyDependencies<D.NonEmptyArrayNode<T, V>>) => new NonEmptyArrayProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}
