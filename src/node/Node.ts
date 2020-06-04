import { sequenceT } from 'fp-ts/lib/Apply'
import { isNonEmpty } from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import { constant, Lazy } from 'fp-ts/lib/function'
import { IO } from 'fp-ts/lib/IO'
import { Monoid } from 'fp-ts/lib/Monoid'
import { getSemigroup, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { fromCompare } from 'fp-ts/lib/Ord'
import { pipe } from 'fp-ts/lib/pipeable'
import { Reader } from 'fp-ts/lib/Reader'
import { sequence, traverseWithIndex } from 'fp-ts/lib/Record'
import * as A from 'fp-ts/lib/Array'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { Tree } from 'fp-ts/lib/Tree'
import { tree } from 'io-ts/lib/Decoder'
import { CacheDependencies } from '../cache'
import * as D from '../document/DocumentNode'
import * as M from '../model/Model'
import * as MAP from 'fp-ts/lib/Map'
import {
	CLOSE_PAREN,
	COLON,
	DOLLAR_SIGN,
	EXCLAMATION,
	isEmptyObject,
	once,
	OPEN_PAREN,
	OPEN_SPACE,
	Ref
} from '../shared'

export type TypeOf<T> = D.ExtractModelType<T>

export type TypeOfVariables<T> = T extends Node ? M.TypeOf<T['variables']['model']> : never

export type TypeOfSchemaVariables<T> = T extends SchemaNode<any, any>
	? D.ExtractDefinitionType<T['variables']['children']>
	: never

export type Node =
	| PrimitiveNode<any>
	| TypeNode<any, any, any>
	| WrappedNode
	| SumNode<any, any>
	| ScalarNode<any, any, any>
	| MutationNode<any, any>

export type PrimitiveNode<V extends VariablesNode = {}> = StringNode<V> | BooleanNode<V> | NumberNode<V>

export interface StringNode<V extends VariablesNode = {}> extends MergeProxy<D.StringNode<V>> {}

export interface BooleanNode<V extends VariablesNode = {}> extends MergeProxy<D.BooleanNode<V>> {}

export interface NumberNode<V extends VariablesNode = {}> extends MergeProxy<D.NumberNode<V>> {}

export interface TypeNode<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesNode = {}>
	extends MergeProxy<D.TypeNode<N, T, V>> {}

export type SchemaNode<N extends string, T extends { [K in keyof T]: Node }> = TypeNode<N, T>

export type WrappedNode =
	| ArrayNode<any, any>
	| MapNode<any, any, any>
	| OptionNode<any, any>
	| NonEmptyArrayNode<any, any>

export interface ArrayNode<T extends Node, V extends VariablesNode = {}> extends MergeProxy<D.ArrayNode<T, V>> {}

export interface MapNode<K extends Node, T extends Node, V extends VariablesNode = {}>
	extends MergeProxy<D.MapNode<K, T, V>> {}

export interface OptionNode<T extends Node, V extends VariablesNode = {}> extends MergeProxy<D.OptionNode<T, V>> {}

export interface NonEmptyArrayNode<T extends Node, V extends VariablesNode = {}>
	extends MergeProxy<D.NonEmptyArrayNode<T, V>> {}

export interface SumNode<T extends { [K in keyof T]: TypeNode<string, any> }, V extends VariablesNode = {}>
	extends MergeProxy<D.SumNode<T, V>> {}

export interface MutationNode<T extends Node, V extends VariablesNode = {}> extends MergeProxy<D.MutationNode<T, V>> {}

export interface ScalarNode<N extends string, T, V extends VariablesNode = {}>
	extends MergeProxy<D.ScalarNode<N, T, V>> {}

export type MergeProxy<T extends D.Node = D.Node> = T & Proxy<T>

export interface Proxy<T> {
	readonly data: Reader<DataProxyDependencies<T>, DataProxy<T>>
	readonly store: Reader<StoreProxyDependencies<T>, StoreProxy<T>>
}

export interface DataProxy<N> {
	write(variables: ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheWriteResult>
	read(
		selection: ExtractSelection<N>
	): Reader<ExtractMergedVariablesType<N>, CacheResult<O.Option<D.ExtractModelType<N>>>>
	toRefs(selection: ExtractSelection<N>): Reader<ExtractMergedVariablesType<N>, CacheResult<D.ExtractRefType<N>>>
	toRef(
		selection: ExtractSelection<N>
	): Reader<ExtractMergedVariablesType<N>, CacheResult<Ref<D.ExtractModelType<N>>>>
}

export interface StoreProxy<N> {
	write(variables: ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheWriteResult>
	read(
		selection: ExtractSelection<N>
	): Reader<ExtractMergedVariablesType<N>, CacheResult<O.Option<D.ExtractModelType<N>>>>
	toRefs(selection: ExtractSelection<N>): Reader<ExtractMergedVariablesType<N>, CacheResult<D.ExtractRefType<N>>>
	toRef(
		selection: ExtractSelection<N>
	): Reader<ExtractMergedVariablesType<N>, CacheResult<Ref<D.ExtractModelType<N>>>>
}

export type ExtractSelection<T> = T extends D.TypeNode<string, any>
	? D.TypeNode<any, any>
	: T extends D.ArrayNode<any>
	? D.ArrayNode<any>
	: T extends D.MapNode<any, any>
	? D.MapNode<any, any>
	: T extends D.NonEmptyArrayNode<any>
	? D.NonEmptyArrayNode<any>
	: T extends D.OptionNode<any>
	? D.OptionNode<any>
	: T extends D.SumNode<any, any>
	? D.SumNode<any, any>
	: never

export interface CacheWriteResult extends CacheResult<Evict> {}

export interface CacheResult<T> extends TE.TaskEither<CacheError, T> {}

export interface Evict extends T.Task<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export type ExtractMergedVariablesType<S> = S extends D.Node
	? keyof D.ExtractChildrenVariablesDefinition<S> extends never
		? D.ExtractVariablesType<S>
		: D.ExtractVariablesType<S> & D.ExtractChildrenVariablesType<S>
	: never

interface DataProxyDependencies<T> extends CacheNodeDependencies {
	node?: T
}

interface StoreProxyDependencies<T> extends CacheNodeDependencies {
	data?: Reader<DataProxyDependencies<T>, DataProxy<T>>
	node?: T
}

export interface CacheNodeDependencies {
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

export interface VariablesNode {
	[K: string]: Node
}

export type ExtractDataProxyType<T> = T extends MergeProxy<infer A> ? DataProxy<A> : never

export type ExtractStoreProxyType<T> = T extends MergeProxy<infer A> ? StoreProxy<A> : never

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

	read(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> => {
			return this.extractProxy(this.encodeVariables(variables)).read(selection)(variables)
		}
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheResult<Evict>> {
		return this.extractProxy(this.encodeVariables(variables)).write(variables)
	}

	toRef(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<Ref<D.ExtractModelType<T>>> => {
			return this.extractProxy(this.encodeVariables(variables)).toRef(selection)(variables)
		}
	}

	toRefs(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> => {
			return this.extractProxy(this.encodeVariables(variables)).toRefs(selection)(variables)
		}
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

class LiteralProxy<T, V extends VariablesNode = {}> implements DataProxy<D.DocumentNode<T, T, Ref<T>, V>> {
	readonly ref: Ref<T>
	constructor(private readonly deps: DataProxyDependencies<D.DocumentNode<T, T, Ref<T>, V>>) {
		this.ref = this.deps.ofRef()
		this.read.bind(this)
		this.write.bind(this)
		this.toRef.bind(this)
		this.toRefs.bind(this)
	}

	read() {
		return () => TE.rightIO(() => this.ref.value)
	}

	write(): Reader<T, CacheResult<Evict>> {
		return (num) =>
			pipe(
				this.read()(),
				TE.chain((previousValue) => {
					const newValue = O.some(num)
					return pipe(
						TE.rightIO(() => {
							this.ref.value = newValue
						}),
						TE.apSecond(this.read()()),
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

	toRef() {
		return () => TE.rightIO(() => this.ref)
	}

	toRefs() {
		return this.toRef()
	}
}

export function number(): NumberNode
export function number<V extends VariablesNode>(variables: V): NumberNode<V>
export function number<V extends VariablesNode>(variables: V, precision?: D.NumberPrecision): NumberNode<V>
export function number<V extends VariablesNode = {}>(
	variables: V = D.EMPTY_VARIABLES,
	precision?: D.NumberPrecision
): NumberNode<V> {
	const node = D.number(variables, precision)
	const data = (deps: DataProxyDependencies<D.NumberNode<V>>) => new LiteralProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

export const staticNumber = number();

export const staticFloat = number({}, 'Float');

export const staticInt = number({}, 'Int');

export function string(): StringNode
export function string<V extends VariablesNode>(variables: V): StringNode<V>
export function string<V extends VariablesNode = {}>(variables: V = D.EMPTY_VARIABLES): StringNode<V> {
	const node = D.string(variables)
	const data = (deps: DataProxyDependencies<D.StringNode<V>>) => new LiteralProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

export const staticString = string()

export function boolean(): BooleanNode
export function boolean<V extends VariablesNode>(variables: V): BooleanNode<V>
export function boolean<V extends VariablesNode = {}>(variables: V = D.EMPTY_VARIABLES): BooleanNode<V> {
	const node = D.boolean(variables)
	const data = (deps: DataProxyDependencies<D.BooleanNode<V>>) => new LiteralProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

export const staticBoolean = boolean()

export function scalar<N extends string, T>(name: N, model: M.Model<T>): ScalarNode<N, T>
export function scalar<N extends string, T, V extends VariablesNode>(
	name: N,
	model: M.Model<T>,
	variables: V
): ScalarNode<N, T, V>
export function scalar<N extends string, T, V extends VariablesNode = {}>(
	name: N,
	model: M.Model<T>,
	variables: V = D.EMPTY_VARIABLES
): ScalarNode<N, T, V> {
	const node = D.scalar(name, model, variables)
	const data = (deps: DataProxyDependencies<D.ScalarNode<N, T, V>>) => new LiteralProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

const recordTraverse = traverseWithIndex(cacheErrorApplicativeValidation)

abstract class BaseProxy<T extends D.Node> implements DataProxy<T> {
	protected constructor(
		protected readonly deps: Pick<DataProxyDependencies<T>, 'persist'> &
			Required<Omit<DataProxyDependencies<T>, 'persist'>>
	) {
		this.read.bind(this)
		this.write.bind(this)
		this.toRef.bind(this)
		this.toRefs.bind(this)
	}
	abstract read(
		selection: ExtractSelection<T>
	): Reader<ExtractMergedVariablesType<T>, CacheResult<O.Option<D.ExtractModelType<T>>>>
	abstract toRefs(
		selection: ExtractSelection<T>
	): Reader<ExtractMergedVariablesType<T>, CacheResult<D.ExtractRefType<T>>>
	abstract write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheWriteResult>

	toRef(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<Ref<D.ExtractModelType<T>>> => {
			return pipe(
				variables,
				this.read(selection),
				TE.map((o) => (O.isSome(o) ? this.deps.ofRef(o.value) : this.deps.ofRef()))
			)
		}
	}
}

class TypeProxy<T extends D.TypeNode<any, any, any>> extends BaseProxy<T> {
	readonly proxy: { [K in keyof T['members']]: ExtractStoreProxyType<T['members'][K]> }
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
		this.proxy = this.getProxy()
	}
	read(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> => {
			return pipe(
				selection.members as Record<keyof T, any>,
				recordTraverse((k, _) => this.proxy[k as keyof T].read(selection.members[k])(variables as any)),
				TE.map(sequence(O.option))
			) as CacheResult<O.Option<D.ExtractModelType<T>>>
		}
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheWriteResult> {
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

	toRefs(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> => {
			return pipe(
				selection as Record<keyof T, any>,
				recordTraverse((k, _) => this.proxy[k as keyof T].toRefs(selection.members[k])(variables as any)),
				TE.map(this.deps.ofRef)
			) as CacheResult<D.ExtractRefType<T>>
		}
	}

	private getProxy() {
		const proxy: Partial<{ [K in keyof T['members']]: ExtractStoreProxyType<T['members'][K]> }> = {}
		const members = this.deps.node.members
		for (const key in members) {
			const member = members[key]
			proxy[key as keyof T['members']] = member.store({
				...this.deps,
				path: `${this.deps.path}.${this.deps.node.__typename}.${key}`,
				node: member
			}) as any
		}
		return proxy as { [K in keyof T['members']]: ExtractStoreProxyType<T['members'][K]> }
	}
}

export function type<N extends string, T extends { [K in keyof T]: Node }>(__typename: N, members: T): TypeNode<N, T>
export function type<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesNode>(
	__typename: N,
	members: T,
	variables: V
): TypeNode<N, T, V>
export function type<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesNode = {}>(
	__typename: N,
	members: T,
	variables: V = D.EMPTY_VARIABLES
): TypeNode<N, T, V> {
	const node = D.type(__typename, members, variables)
	const data = (deps: DataProxyDependencies<D.TypeNode<N, T, V>>) =>
		new TypeProxy<D.TypeNode<N, T, V>>({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

export function schema<N extends string, T extends { [K in keyof T]: Node }>(
	__typename: N,
	members: T
): TypeNode<N, T> & { readonly tag: 'Schema' } {
	const node = D.schema(__typename, members) as any
	const data = (deps: DataProxyDependencies<D.TypeNode<N, T>>) => new TypeProxy<D.TypeNode<N, T>>({ ...deps, node })
	return {
		...node,
		data,
		store: data
	}
}

const withMap = MAP.getWitherable(fromCompare(constant(0)))

const traverseMapCacheResult = withMap.traverse(cacheErrorApplicativeValidation)

const traverseWithIndexMapCacheResult = withMap.traverseWithIndex(cacheErrorApplicativeValidation as any)

const sequenceMapOption = withMap.sequence(O.option)

class MapProxy<T extends D.MapNode<any, any, any>> extends BaseProxy<T> {
	readonly proxy: Map<D.ExtractModelType<T['key']>, StoreProxy<T['wrapped']>> = new Map()
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
	}

	read(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> => {
			return pipe(
				traverseMapCacheResult(this.proxy, (m) => m.read(selection.wrapped)(variables as any)),
				TE.map(sequenceMapOption)
			) as CacheResult<O.Option<D.ExtractModelType<T>>>
		}
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return traverseWithIndexMapCacheResult<
				D.ExtractPartialModelType<T>,
				D.ExtractModelType<T['key']>,
				CacheError,
				Evict
			>(
				data as Map<unknown, D.ExtractPartialModelType<T>>,
				((k: D.ExtractModelType<T['key']>, v: D.ExtractPartialModelType<T['wrapped']>) => {
					return pipe(
						TE.rightIO(this.getProxy(k as D.ExtractModelType<T['key']>)),
						TE.chain((p) => p.write(variables as any)(v))
					)
				}) as any
			)
		}
	}

	toRefs(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> => {
			return pipe(
				traverseMapCacheResult(this.proxy, (m) => m.toRefs(selection.wrapped)(variables as any)),
				TE.map(this.deps.ofRef)
			) as CacheResult<D.ExtractRefType<T>>
		}
	}

	private getProxy(key: D.ExtractModelType<T['key']>): IO<StoreProxy<T['wrapped']>> {
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

export function map<K extends Node, T extends Node>(key: K, value: T): MapNode<K, T>
export function map<K extends Node, T extends Node, V extends VariablesNode>(
	key: K,
	value: T,
	variables: V
): MapNode<K, T, V>
export function map<K extends Node, T extends Node, V extends VariablesNode = {}>(
	key: K,
	value: T,
	variables: V = D.EMPTY_VARIABLES
): MapNode<K, T, V> {
	const node = D.map(key, value, variables)
	const data = (deps: DataProxyDependencies<D.MapNode<K, T, V>>) => new MapProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

class ArrayProxy<T extends D.ArrayNode<any, any>> extends BaseProxy<T> {
	proxy: StoreProxy<T['wrapped']>[] = []
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
	}

	read(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> => {
			return pipe(
				A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) =>
					m.read(selection.wrapped)(variables as any)
				),
				TE.map(A.array.sequence(O.option))
			) as CacheResult<O.Option<D.ExtractModelType<T>>>
		}
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return pipe(
				TE.rightIO(this.getProxy(data)),
				TE.chain((proxy) =>
					A.array.traverseWithIndex(cacheErrorApplicativeValidation)(proxy, (i, a) => {
						return a.write(variables as any)((data as any)[i])
					})
				),
				TE.map(A.reduce(taskVoid, concatEvict))
			)
		}
	}

	toRefs(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> => {
			return pipe(
				A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) =>
					m.toRefs(selection.wrapped)(variables as any)
				),
				TE.map(this.deps.ofRef)
			) as CacheResult<D.ExtractRefType<T>>
		}
	}

	private getProxy(data: D.ExtractPartialModelType<T>): IO<StoreProxy<T['wrapped']>[]> {
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

export function array<T extends Node>(wrapped: T): ArrayNode<T>
export function array<T extends Node, V extends VariablesNode>(wrapped: T, variables: V): ArrayNode<T, V>
export function array<T extends Node, V extends VariablesNode = {}>(
	wrapped: T,
	variables: V = D.EMPTY_VARIABLES
): ArrayNode<T, V> {
	const node = D.array(wrapped, variables)
	const data = (deps: DataProxyDependencies<D.ArrayNode<T, V>>) => new ArrayProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

class SumProxy<T extends D.SumNode<any, any>> extends BaseProxy<T> {
	type: O.Option<keyof T['members']> = O.none
	proxy: O.Option<{ [K in keyof T['members']]: StoreProxy<T['members'][K]> }[keyof T['members']]> = O.none
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
	}

	read(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> => {
			return pipe(
				optionSequenceT(this.proxy, this.type),
				O.fold(constant(TE.right(O.none)), ([p, t]) => p.read(selection.members[t])(variables as any))
			)
		}
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return pipe(
				TE.rightIO(this.getProxy(data)),
				TE.chain(O.fold(constant(TE.right(taskVoid)), (p) => p.write(variables as any)(data)))
			)
		}
	}

	toRefs(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> => {
			return pipe(
				optionSequenceT(this.proxy, this.type),
				O.fold(constant(TE.right(this.deps.ofRef())), ([p, k]) =>
					pipe(p.toRefs(selection.members[k])(variables as any), TE.map(this.deps.ofRef))
				)
			) as CacheResult<D.ExtractRefType<T>>
		}
	}

	private getProxy(
		data: D.ExtractPartialModelType<T>
	): IO<O.Option<{ [K in keyof T['members']]: StoreProxy<T['members'][K]> }[keyof T['members']]>> {
		return () => {
			const members = this.deps.node.members
			for (const k in members) {
				const member = members[k]
				if (member.model.partial.is(data)) {
					const newProxy = O.some(
						member.store({ ...this.deps, path: `${this.deps.path}-${k}`, node: member })
					)
					this.type = O.some(k)
					this.proxy = newProxy
					return newProxy
				}
			}
			return this.proxy
		}
	}
}

export function sum<T extends { [K in keyof T]: TypeNode<any, any, any> }>(members: T): SumNode<T>
export function sum<T extends { [K in keyof T]: TypeNode<any, any, any> }, V extends VariablesNode>(
	members: T,
	variables: V
): SumNode<T, V>
export function sum<T extends { [K in keyof T]: TypeNode<any, any, any> }, V extends VariablesNode = {}>(
	members: T,
	variables: V = D.EMPTY_VARIABLES
): SumNode<T, V> {
	const node = D.sum(members, variables)
	const data = (deps: DataProxyDependencies<D.SumNode<T, V>>) => new SumProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

const optionSequenceT = sequenceT(O.option)

class OptionProxy<T extends D.OptionNode<any, any>> extends BaseProxy<T> {
	proxy: O.Option<StoreProxy<T>> = O.none
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
	}

	read(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> => {
			return pipe(
				this.proxy,
				O.fold(constant(TE.right(O.none)), (p) => p.read(selection.wrapped)(variables as any))
			)
		}
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return pipe(
				TE.rightIO(this.getProxy(data)),
				TE.chain((oProxy) =>
					pipe(
						optionSequenceT(oProxy, data),
						O.fold(constant(TE.right(taskVoid)), ([proxy, data]) =>
							proxy.write(variables as any)(data as D.ExtractPartialModelType<T>)
						)
					)
				)
			)
		}
	}

	toRefs(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> => {
			return pipe(
				this.proxy,
				O.fold(constant(TE.right(this.deps.ofRef())), (p) =>
					pipe(p.toRefs(selection.wrapped)(variables as any), TE.map(O.some), TE.map(this.deps.ofRef))
				)
			) as CacheResult<D.ExtractRefType<T>>
		}
	}

	private getProxy(data: D.ExtractPartialModelType<T>): IO<O.Option<StoreProxy<T>>> {
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

export function option<T extends Node>(wrapped: T): OptionNode<T>
export function option<T extends Node, V extends VariablesNode>(wrapped: T, variables: V): OptionNode<T, V>
export function option<T extends Node, V extends VariablesNode = {}>(
	wrapped: T,
	variables: V = D.EMPTY_VARIABLES
): OptionNode<T, V> {
	const node = D.option(wrapped, variables)
	const data = (deps: DataProxyDependencies<D.OptionNode<T, V>>) => new OptionProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

class NonEmptyArrayProxy<T extends D.NonEmptyArrayNode<any, any>> extends BaseProxy<T> {
	proxy: StoreProxy<T['wrapped']>[] = []
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
	}

	read(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> => {
			return pipe(
				A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) =>
					m.read(selection.wrapped)(variables as any)
				),
				TE.map((results) =>
					pipe(
						results,
						A.array.sequence(O.option),
						O.chain((value) => (isNonEmpty(value) ? O.some(value) : O.none))
					)
				)
			) as CacheResult<O.Option<D.ExtractModelType<T>>>
		}
	}
	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return pipe(
				TE.rightIO(this.getProxy(data)),
				TE.chain((proxy) =>
					A.array.traverseWithIndex(cacheErrorApplicativeValidation)(proxy, (i, a) => {
						return a.write(variables as any)((data as any)[i])
					})
				),
				TE.map(A.reduce(taskVoid, concatEvict))
			)
		}
	}

	toRefs(selection: ExtractSelection<T>) {
		return (variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> => {
			return pipe(
				A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) =>
					m.toRefs(selection.wrapped)(variables as any)
				),
				TE.map((val) => (isNonEmpty(val) ? this.deps.ofRef(val) : this.deps.ofRef()))
			) as CacheResult<D.ExtractRefType<T>>
		}
	}

	private getProxy(data: D.ExtractPartialModelType<T>): IO<StoreProxy<T['wrapped']>[]> {
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

export function nonEmptyArray<T extends Node>(wrapped: T): NonEmptyArrayNode<T>
export function nonEmptyArray<T extends Node, V extends VariablesNode>(
	wrapped: T,
	variables: V
): NonEmptyArrayNode<T, V>
export function nonEmptyArray<T extends Node, V extends VariablesNode = {}>(
	wrapped: T,
	variables: V = D.EMPTY_VARIABLES
): NonEmptyArrayNode<T, V> {
	const node = D.nonEmptyArray(wrapped, variables)
	const data = (deps: DataProxyDependencies<D.NonEmptyArrayNode<T, V>>) => new NonEmptyArrayProxy({ ...deps, node })
	return {
		...node,
		data,
		store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store({ node, data, ...deps }))
	}
}

const EMPTY_PROXY_ERROR: CacheResult<any> = TE.left([tree('no proxy exists for this node')])

const CONST_EMPTY_PROXY_ERROR = constant(constant(EMPTY_PROXY_ERROR))

const EMPTY_PROXY: DataProxy<any> = {
	write: CONST_EMPTY_PROXY_ERROR,
	read: CONST_EMPTY_PROXY_ERROR,
	toRefs: CONST_EMPTY_PROXY_ERROR,
	toRef: CONST_EMPTY_PROXY_ERROR
}

const CONST_EMPTY_PROXY = constant(EMPTY_PROXY)

export function mutation<T extends Node>(result: T): MutationNode<T>
export function mutation<T extends Node, V extends VariablesNode>(result: T, variables: V): MutationNode<T, V>
export function mutation<T extends Node, V extends VariablesNode = {}>(
	result: T,
	variables: V = D.EMPTY_VARIABLES
): MutationNode<T, V> {
	const node = D.mutation(result, variables)
	return {
		...node,
		data: CONST_EMPTY_PROXY,
		store: CONST_EMPTY_PROXY as Reader<CacheDependencies, StoreProxy<any>>
	}
}

function printVariables<V extends VariablesNode>(variables: V): string {
	const tokens: string[] = [OPEN_PAREN]
	const keys = Object.keys(variables)
	const length = keys.length
	const last = length - 1
	let i = 0
	for (; i < length; i++) {
		const key = keys[i]
		tokens.push(DOLLAR_SIGN, key, COLON, OPEN_SPACE, printVariableName(variables[key]), i === last ? '' : ', ')
	}
	tokens.push(CLOSE_PAREN)
	return tokens.join('')
}

function printVariableName(node: Node, isOptional: boolean = false): string {
	const optionalString = isOptional ? '' : EXCLAMATION
	switch (node.tag) {
		case 'Array':
		case 'NonEmptyArray':
			return `[${printVariableName(node.wrapped, D.isOptionNode(node.wrapped))}]${optionalString}`
		case 'Map':
			return `Map[${printVariableName(node.key)}, ${printVariableName(
				node.wrapped,
				D.isOptionNode(node.wrapped)
			)}]${optionalString}`
		case 'Option':
			return printVariableName(node.wrapped, true)
		case 'Boolean':
		case 'String':
			return `${node.tag}${optionalString}`
		case 'Number':
			return `${node.precision}${optionalString}`
		case 'Scalar':
			return `${node.name}${optionalString}`
		case 'Type':
			return `${node.__typename}${optionalString}`
		default:
			return ''
	}
}

export function print<N extends string, T extends { [K in keyof T]: Node }>(
	schema: SchemaNode<N, T>,
	operation: string,
	operationName: string
): Lazy<string> {
	return once(() => {
		const tokens = [operation, ' ', operationName]
		if (!isEmptyObject(schema.variables.children)) {
			tokens.push(printVariables(schema.variables.children))
		}
		tokens.push(OPEN_SPACE, schema.print())
		return tokens.join('')
	})
}
