import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { Task } from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { Tree } from 'fp-ts/lib/Tree'
import * as D from '../document/DocumentNode'
import * as M from '../model/Model'
import { Ref } from '../shared'

export interface CacheProxy<N> {
	write(variables: ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheResult<Evict>>
	read(variables: ExtractMergedVariablesType<N>): CacheResult<D.ExtractModelType<N>>
	toRefs(variables: ExtractMergedVariablesType<N>): CacheResult<D.ExtractRefType<N>>
	toRef(variables: ExtractMergedVariablesType<N>): CacheResult<Ref<D.ExtractModelType<N>>>
}

export interface CacheWriteResult extends CacheResult<Evict> {}

export interface CacheResult<T> extends TE.TaskEither<CacheError, T> {}

export interface Evict extends Task<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export type ExtractMergedVariablesType<S> = S extends D.Node
	? keyof D.ExtractMergedVariables<S> extends never
	? undefined
	: D.ExtractVariables<D.ExtractMergedVariables<S>>
	: never

interface CacheNodeDependencies<T extends CacheNode<any>> extends StoreDependencies {
	path: string
	node: T
}

export interface StoreDependencies {
	ofRef: OfRef
	persist?: Persist
}

export interface OfRef {
	<T>(value?: T): Ref<T>
}

export interface Persist {
	store(key: string, value: string): Task<void>
	restore<T>(key: string): Task<O.Option<T>>
}

export type CacheNode<T extends D.Node> = T & { store: Reader<CacheNodeDependencies<T>, CacheProxy<T>> }

export type ExtractProxyType<T> = T extends CacheNode<infer A> ? CacheProxy<A> : never;

abstract class LiteralProxy<V extends

class NumberProxy<V extends D.VariablesNode = {}> {

}

export function number(): CacheNode<D.NumberNode>
export function number<V extends D.VariablesNode>(variables: V): CacheNode<D.NumberNode<V>>
export function number<V extends D.VariablesNode = {}>(variables: V = D.EMPTY_VARIABLES): CacheNode<D.NumberNode<V>> {
	const n = D.number(variables)
	return {
		...n,
		store: null as any
	}
}

export const staticNumber = number()



export function string(): CacheNode<D.StringNode>
export function string<V extends D.VariablesNode>(variables: V): CacheNode<D.StringNode<V>>
export function string<V extends D.VariablesNode = {}>(variables: V = D.EMPTY_VARIABLES): CacheNode<D.StringNode<V>> {
	const n = D.string(variables)
	return {
		...n,
		store: null as any
	}
}

export const staticString = string()

export function boolean(): CacheNode<D.BooleanNode>
export function boolean<V extends D.VariablesNode>(variables: V): CacheNode<D.BooleanNode<V>>
export function boolean<V extends D.VariablesNode = {}>(variables: V = D.EMPTY_VARIABLES): CacheNode<D.BooleanNode<V>> {
	const n = D.boolean(variables)
	return {
		...n,
		store: null as any
	}
}

export const staticBoolean = boolean()

export function type<N extends string, T extends { [K in keyof T]: CacheNode<D.Node> }>(
	__typename: N,
	members: T
): CacheNode<D.TypeNode<N, T>>
export function type<N extends string, T extends { [K in keyof T]: CacheNode<D.Node> }, V extends D.VariablesNode>(
	__typename: N,
	members: T,
	variables: V
): CacheNode<D.TypeNode<N, T, V>>
export function type<N extends string, T extends { [K in keyof T]: CacheNode<D.Node> }, V extends D.VariablesNode = {}>(
	__typename: N,
	members: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.TypeNode<N, T, V>> {
	const n = D.type(__typename, members, variables)
	return {
		...n,
		store: null as any
	}
}

class Proxy<T extends D.Node> implements CacheProxy<T> {
	protected readonly refMap: Map<unknown, CacheResult<Ref<D.ExtractModelType<T>>>> = new Map();
	protected readonly refsMap: Map<unknown, D.ExtractRefType<T>> = new Map();
	protected readonly proxyMap: Map<unknown, CacheProxy<T>> = new Map();

	constructor(protected readonly deps: CacheNodeDependencies<CacheNode<T>>) {}

	read(variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractModelType<T>> {
		return this.extractProxy(this.encodeVariables(variables)).read(variables);
	}

	write(variables: ExtractMergedVariablesType<T>): Reader<D.ExtractPartialModelType<T>, CacheResult<Evict>> {
		return this.extractProxy(this.encodeVariables(variables)).write(variables);
	}

	toRef(variables: ExtractMergedVariablesType<T>): CacheResult<Ref<D.ExtractModelType<T>>> {
		const encodedVariables = this.encodeVariables(variables);
		const ref = this.refMap.get(encodedVariables);
		if (ref) {
			return ref;
		} else {
			const newRef = this.extractProxy(encodedVariables).toRef(variables);
			this.refMap.set(encodedVariables, newRef);
			return newRef;
		}
	}

	toRefs(variables: ExtractMergedVariablesType<T>): CacheResult<D.ExtractRefType<T>> {
		const encodedVariables = this.encodeVariables(variables);
		const refs = this.refsMap.get(encodedVariables);
		if (refs) {
			return refs;
		} else {
			const newRefs = this.extractProxy(encodedVariables).toRefs(variables);
			this.refMap.set(encodedVariables, newRefs);
			return newRefs;
		}
	}

	protected extractProxy(encodedVariables: unknown): CacheProxy<T> {
		const proxy = this.proxyMap.get(encodedVariables);
		if (proxy) {
			return proxy;
		} else {
			const newProxy = this.make(encodedVariables as string);
			this.proxyMap.set(encodedVariables, newProxy);
			return newProxy;
		}
	}

	protected make(path: string): CacheProxy<T> {
		return this.deps.node.store({
			...this.deps,
			path: `${this.deps.path}-${path}`
		})
	}

	protected encodeVariables(variables: ExtractMergedVariablesType<T>): unknown {
		return this.deps.node.variables.model.encode(this.extractNodeVariables(variables));
	}

	protected extractNodeVariables(
		variables: ExtractMergedVariablesType<T>
	): D.ExtractVariables<T['variables']['definition']> {
		const x: any = {}
		Object.keys(this.deps.node.variables).forEach((key) => {
			x[key] = variables && variables[key]
		})
		return x
	}

}


export function map<K extends CacheNode<D.Node>, T extends CacheNode<D.Node>>(
	key: K,
	value: T
): CacheNode<D.MapNode<K, T, {}>>
export function map<K extends CacheNode<D.Node>, T extends CacheNode<D.Node>, V extends D.VariablesNode>(
	key: K,
	value: T,
	variables: V
): CacheNode<D.MapNode<K, T, V>>
export function map<K extends CacheNode<D.Node>, T extends CacheNode<D.Node>, V extends D.VariablesNode = {}>(
	key: K,
	value: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.MapNode<K, T, V>> {
	const n = D.map(key, value, variables)
	return {
		...n,
		store: null as any
	}
}

export function array<T extends CacheNode<D.Node>>(node: T): CacheNode<D.ArrayNode<T>>
export function array<T extends CacheNode<D.Node>, V extends D.VariablesNode>(
	node: T,
	variables: V
): CacheNode<D.ArrayNode<T, V>>
export function array<T extends CacheNode<D.Node>, V extends D.VariablesNode = {}>(
	node: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.ArrayNode<T, V>> {
	const n = D.array(node, variables)
	return {
		...n,
		store: null as any
	}
}

export function sum<T extends { [K in keyof T]: CacheNode<D.TypeNode<string, any>> }>(
	members: T
): CacheNode<D.SumNode<T>>
export function sum<T extends { [K in keyof T]: CacheNode<D.TypeNode<string, any>> }, V extends D.VariablesNode>(
	members: T,
	variables: V
): CacheNode<D.SumNode<T, V>>
export function sum<T extends { [K in keyof T]: CacheNode<D.TypeNode<string, any>> }, V extends D.VariablesNode = {}>(
	members: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.SumNode<T, V>> {
	const n = D.sum(members, variables)
	return {
		...n,
		store: null as any
	}
}

export function option<T extends CacheNode<D.Node>>(node: T): CacheNode<D.OptionNode<T>>
export function option<T extends CacheNode<D.Node>, V extends D.VariablesNode>(
	node: T,
	variables: V
): CacheNode<D.OptionNode<T, V>>
export function option<T extends CacheNode<D.Node>, V extends D.VariablesNode = {}>(
	node: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.OptionNode<T, V>> {
	const n = D.option(node, variables)
	return {
		...n,
		store: null as any
	}
}

export function nonEmptyArray<T extends D.Node>(node: T): CacheNode<D.NonEmptyArrayNode<T>>
export function nonEmptyArray<T extends D.Node, V extends D.VariablesNode>(
	node: T,
	variables: V
): CacheNode<D.NonEmptyArrayNode<T, V>>
export function nonEmptyArray<T extends D.Node, V extends D.VariablesNode = {}>(
	node: T,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.NonEmptyArrayNode<T, V>> {
	const n = D.nonEmptyArray(node, variables)
	return {
		...n,
		store: null as any
	}
}

export function scalar<N extends string, T>(name: N, model: M.Model<T>): CacheNode<D.ScalarNode<N, T>>
export function scalar<N extends string, T, V extends D.VariablesNode>(
	name: N,
	model: M.Model<T>,
	variables: V
): CacheNode<D.ScalarNode<N, T, V>>
export function scalar<N extends string, T, V extends D.VariablesNode = {}>(
	name: N,
	model: M.Model<T>,
	variables: V = D.EMPTY_VARIABLES
): CacheNode<D.ScalarNode<N, T, V>> {
	const n = D.scalar(name, model, variables)
	return {
		...n,
		store: null as any
	}
}

export function schema<T extends { [K in keyof T]: CacheNode<D.Node> }>(members: T): CacheNode<D.Schema<T>> {
	const n = D.schema(members)
	return {
		...n,
		store: null as any
	}
}
