import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'
import { Reader } from 'fp-ts/lib/Reader'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { Tree } from 'fp-ts/lib/Tree'
import * as D from '../document/DocumentNode'
import * as M from '../model/Model'
import { Ref } from '../shared'

export interface DataProxy<N> {
	write(variables: D.ExtractChildrenVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheResult<Evict>>
	read(variables: D.ExtractChildrenVariablesType<N>): CacheResult<O.Option<D.ExtractModelType<N>>>
	toRefs(variables: D.ExtractChildrenVariablesType<N>): CacheResult<D.ExtractRefType<N>>
	toRef(variables: D.ExtractChildrenVariablesType<N>): CacheResult<Ref<D.ExtractModelType<N>>>
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
		? D.ExtractVariablesDefinitionType<S>
		: D.ExtractVariablesDefinitionType<S> & D.ExtractChildrenVariablesType<S>
	: never

interface CacheNodeDependencies<T> extends CacheDependencies {
	node: T
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
	store(key: string, value: string): TE.TaskEither<Error, void>
	restore<T>(key: string): TE.TaskEither<Error, O.Option<T>>
}

export type CacheNode<T extends D.Node> = T & CacheInfo<T>

export interface CacheInfo<N> {
	data: Reader<CacheNodeDependencies<N>, DataProxy<N>>
	store: Reader<CacheNodeDependencies<N>, StoreProxy<N>>
}

export type ExtractProxyType<T> = T extends CacheInfo<infer A> ? DataProxy<A> : never

class Store<T extends D.Node> implements StoreProxy<T> {
	protected readonly refMap: Map<unknown, CacheResult<Ref<D.ExtractModelType<T>>>> = new Map()
	protected readonly refsMap: Map<unknown, D.ExtractRefType<T>> = new Map()
	protected readonly proxyMap: Map<unknown, DataProxy<T>> = new Map()

	constructor(protected readonly deps: CacheNodeDependencies<CacheNode<T>>) {
		this.read.bind(this)
		this.write.bind(this)
		this.toRef.bind(this)
		this.toRefs.bind(this)
	}

	read(variables: ExtractMergedVariablesType<T>): CacheResult<O.Option<D.ExtractModelType<T>>> {
		return this.extractProxy(this.encodeVariables(variables)).read(variables as D.ExtractChildrenVariablesType<T>)
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheResult<Evict>> {
		return this.extractProxy(this.encodeVariables(variables)).write(variables as D.ExtractChildrenVariablesType<T>)
	}

	toRef(variables: ExtractMergedVariablesType<T>): CacheResult<Ref<D.ExtractModelType<T>>> {
		const encodedVariables = this.encodeVariables(variables)
		const ref = this.refMap.get(encodedVariables)
		if (ref) {
			return ref
		} else {
			const newRef = this.extractProxy(encodedVariables).toRef(variables as D.ExtractChildrenVariablesType<T>)
			this.refMap.set(encodedVariables, newRef)
			return newRef
		}
	}

	toRefs(variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> {
		const encodedVariables = this.encodeVariables(variables)
		const refs = this.refsMap.get(encodedVariables)
		if (refs) {
			return refs
		} else {
			const newRefs = this.extractProxy(encodedVariables).toRefs(variables as D.ExtractChildrenVariablesType<T>)
			this.refMap.set(encodedVariables, newRefs)
			return newRefs
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
		return this.deps.node.data({
			...this.deps,
			path: `${this.deps.path}-${path}`
		})
	}

	protected encodeVariables(variables: ExtractMergedVariablesType<T>): unknown {
		return this.deps.node.variables.model.encode(variables)
	}
}



class NumberProxy implements DataProxy<D.NumberNode<any>> {
	readonly ref: Ref<number>
	constructor(private readonly deps: CacheNodeDependencies<D.NumberNode<any>>) {
		this.ref = this.deps.ofRef()
	}

	read(): CacheResult<O.Option<D.ExtractModelType<D.NumberNode<any>>>> {
		return TE.rightIO(() => this.ref.value)
	}

	write(): Reader<D.ExtractPartialModelType<D.NumberNode<any>>, CacheResult<Evict>> {
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

	toRef(): CacheResult<Ref<D.ExtractModelType<D.NumberNode<any>>>> {
		return TE.rightIO(() => this.ref);
	}

	toRefs(): CacheResult<D.ExtractRefType<D.NumberNode<any>>> {
		return this.toRef()
	}
}

export function number(): CacheInfo<D.NumberNode>
export function number<V extends D.VariablesNode>(variables: V): CacheInfo<D.NumberNode<V>>
export function number<V extends D.VariablesNode = {}>(variables: V = D.EMPTY_VARIABLES): CacheInfo<D.NumberNode<V>> {
	const node = D.number(variables)
	return {
		...node,
		data: deps => new NumberProxy({...deps, node }),
		store: null as any
	}
}

export const staticNumber = number()

export function string(): CacheInfo<D.StringNode>
export function string<V extends D.VariablesNode>(variables: V): CacheInfo<D.StringNode<V>>
export function string<V extends D.VariablesNode = {}>(variables: V = D.EMPTY_VARIABLES): CacheInfo<D.StringNode<V>> {
	const n = D.string(variables)
	return {
		...n,
		store: null as any
	}
}

export const staticString = string()

export function boolean(): CacheInfo<D.BooleanNode>
export function boolean<V extends D.VariablesNode>(variables: V): CacheInfo<D.BooleanNode<V>>
export function boolean<V extends D.VariablesNode = {}>(variables: V = D.EMPTY_VARIABLES): CacheInfo<D.BooleanNode<V>> {
	const n = D.boolean(variables)
	return {
		...n,
		store: null as any
	}
}

export const staticBoolean = boolean()

export function type<N extends string, T extends { [K in keyof T]: CacheInfo<D.Node> }>(
	__typename: N,
	members: T
): CacheInfo<D.TypeNode<N, T>>
export function type<N extends string, T extends { [K in keyof T]: CacheInfo<D.Node> }, V extends D.VariablesNode>(
	__typename: N,
	members: T,
	variables: V
): CacheInfo<D.TypeNode<N, T, V>>
export function type<N extends string, T extends { [K in keyof T]: CacheInfo<D.Node> }, V extends D.VariablesNode = {}>(
	__typename: N,
	members: T,
	variables: V = D.EMPTY_VARIABLES
): CacheInfo<D.TypeNode<N, T, V>> {
	const n = D.type(__typename, members, variables)
	return {
		...n,
		store: null as any
	}
}

export function map<K extends CacheInfo<D.Node>, T extends CacheInfo<D.Node>>(
	key: K,
	value: T
): CacheInfo<D.MapNode<K, T, {}>>
export function map<K extends CacheInfo<D.Node>, T extends CacheInfo<D.Node>, V extends D.VariablesNode>(
	key: K,
	value: T,
	variables: V
): CacheInfo<D.MapNode<K, T, V>>
export function map<K extends CacheInfo<D.Node>, T extends CacheInfo<D.Node>, V extends D.VariablesNode = {}>(
	key: K,
	value: T,
	variables: V = D.EMPTY_VARIABLES
): CacheInfo<D.MapNode<K, T, V>> {
	const n = D.map(key, value, variables)
	return {
		...n,
		store: null as any
	}
}

export function array<T extends CacheInfo<D.Node>>(node: T): CacheInfo<D.ArrayNode<T>>
export function array<T extends CacheInfo<D.Node>, V extends D.VariablesNode>(
	node: T,
	variables: V
): CacheInfo<D.ArrayNode<T, V>>
export function array<T extends CacheInfo<D.Node>, V extends D.VariablesNode = {}>(
	node: T,
	variables: V = D.EMPTY_VARIABLES
): CacheInfo<D.ArrayNode<T, V>> {
	const n = D.array(node, variables)
	return {
		...n,
		store: null as any
	}
}

export function sum<T extends { [K in keyof T]: CacheInfo<D.TypeNode<string, any>> }>(
	members: T
): CacheInfo<D.SumNode<T>>
export function sum<T extends { [K in keyof T]: CacheInfo<D.TypeNode<string, any>> }, V extends D.VariablesNode>(
	members: T,
	variables: V
): CacheInfo<D.SumNode<T, V>>
export function sum<T extends { [K in keyof T]: CacheInfo<D.TypeNode<string, any>> }, V extends D.VariablesNode = {}>(
	members: T,
	variables: V = D.EMPTY_VARIABLES
): CacheInfo<D.SumNode<T, V>> {
	const n = D.sum(members, variables)
	return {
		...n,
		store: null as any
	}
}

export function option<T extends CacheInfo<D.Node>>(node: T): CacheInfo<D.OptionNode<T>>
export function option<T extends CacheInfo<D.Node>, V extends D.VariablesNode>(
	node: T,
	variables: V
): CacheInfo<D.OptionNode<T, V>>
export function option<T extends CacheInfo<D.Node>, V extends D.VariablesNode = {}>(
	node: T,
	variables: V = D.EMPTY_VARIABLES
): CacheInfo<D.OptionNode<T, V>> {
	const n = D.option(node, variables)
	return {
		...n,
		store: null as any
	}
}

export function nonEmptyArray<T extends D.Node>(node: T): CacheInfo<D.NonEmptyArrayNode<T>>
export function nonEmptyArray<T extends D.Node, V extends D.VariablesNode>(
	node: T,
	variables: V
): CacheInfo<D.NonEmptyArrayNode<T, V>>
export function nonEmptyArray<T extends D.Node, V extends D.VariablesNode = {}>(
	node: T,
	variables: V = D.EMPTY_VARIABLES
): CacheInfo<D.NonEmptyArrayNode<T, V>> {
	const n = D.nonEmptyArray(node, variables)
	return {
		...n,
		store: null as any
	}
}

export function scalar<N extends string, T>(name: N, model: M.Model<T>): CacheInfo<D.ScalarNode<N, T>>
export function scalar<N extends string, T, V extends D.VariablesNode>(
	name: N,
	model: M.Model<T>,
	variables: V
): CacheInfo<D.ScalarNode<N, T, V>>
export function scalar<N extends string, T, V extends D.VariablesNode = {}>(
	name: N,
	model: M.Model<T>,
	variables: V = D.EMPTY_VARIABLES
): CacheInfo<D.ScalarNode<N, T, V>> {
	const n = D.scalar(name, model, variables)
	return {
		...n,
		store: null as any
	}
}

export function schema<T extends { [K in keyof T]: CacheInfo<D.Node> }>(members: T): CacheInfo<D.Schema<T>> {
	const n = D.schema(members)
	return {
		...n,
		store: null as any
	}
}
