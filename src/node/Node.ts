import { sequenceT } from 'fp-ts/lib/Apply'
import * as A from 'fp-ts/lib/Array'
import { constant, constVoid, Lazy } from 'fp-ts/lib/function'
import { IO } from 'fp-ts/lib/IO'
import * as IOE from 'fp-ts/lib/IOEither'
import * as MAP from 'fp-ts/lib/Map'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { fromCompare } from 'fp-ts/lib/Ord'
import { pipe } from 'fp-ts/lib/pipeable'
import { Reader } from 'fp-ts/lib/Reader'
import { sequence, traverseWithIndex } from 'fp-ts/lib/Record'
import { Show } from 'fp-ts/lib/Show'
import { tree } from 'io-ts/lib/Decoder'
import * as M from '../model/Model'
import {
	CacheError,
	cacheErrorApplicativeValidation,
	CacheResult,
	CacheWriteResult,
	cacheWriteResultMonoid,
	CLOSE_BRACKET,
	CLOSE_PAREN,
	COLON,
	concatEvict,
	constEmptyArray,
	constEmptyString,
	constMap,
	constNone,
	DOLLAR_SIGN,
	ELLIPSIS,
	Evict,
	EXCLAMATION,
	isEmptyObject,
	isEmptyString,
	ON,
	OPEN_BRACKET,
	OPEN_PAREN,
	OPEN_SPACE,
	Persist,
	Reactivity,
	Ref,
	taskVoid,
	TYPENAME
} from '../shared'

export type TypeOf<T> = ExtractModelType<T>

export type TypeOfVariables<T> = ExtractDefinitionType<ExtractVariablesDefinition<T>>

export type TypeOfChildrenVariables<T> = ExtractDefinitionType<ExtractChildrenVariablesDefinition<T>>

export type TypeOfMergedVariables<T> = TypeOfVariables<T> & TypeOfChildrenVariables<T>

export type TypeOfRefs<T> = T extends { readonly model: NodeModel<any, any, infer A> } ? A : never

export type Node =
	| PrimitiveNode<any>
	| TypeNode<any, any, any>
	| WrappedNode
	| SumNode<any, any>
	| ScalarNode<any, any, any>
	| MutationNode<any, any>

export type PrimitiveNode<V extends VariablesDefinition = {}> =
	| StringNode<V>
	| BooleanNode<V>
	| FloatNode<V>
	| IntNode<V>

export interface StringNode<V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<string, string, Ref<O.Option<string>>, V> {
	readonly tag: 'String'
}

export interface BooleanNode<V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<boolean, boolean, Ref<O.Option<boolean>>, V> {
	readonly tag: 'Boolean'
}

export interface IntNode<V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<number, number, Ref<O.Option<number>>, V> {
	readonly tag: 'Int'
}

export interface FloatNode<V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<number, number, Ref<O.Option<number>>, V> {
	readonly tag: 'Float'
}

export interface TypeNode<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<
		{ [K in keyof T]: ExtractModelType<T[K]> },
		Partial<{ [K in keyof T]: ExtractPartialModelType<T[K]> }>,
		{ [K in keyof T]: TypeOfRefs<T[K]> },
		V,
		{} & Intersection<
			Values<{ [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]> }>
		>
	> {
	readonly __typename: N
	readonly tag: 'Type'
	readonly members: T
}

export type SchemaNode<N extends string, T extends { [K in keyof T]: Node }> = TypeNode<N, T>

export type WrappedNode =
	| ArrayNode<any, any>
	| MapNode<any, any, any>
	| OptionNode<any, any>
	| NonEmptyArrayNode<any, any>

export interface ArrayNode<T extends Node, V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<
		ExtractModelType<T>[],
		ExtractPartialModelType<T>[],
		Ref<TypeOfRefs<T>[]>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Array'
	readonly wrapped: T
}

export interface MapNode<K extends Node, T extends Node, V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<
		Map<ExtractModelType<K>, ExtractModelType<T>>,
		Map<ExtractModelType<K>, ExtractPartialModelType<T>>,
		Ref<Map<unknown, TypeOfRefs<T>>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Map'
	readonly key: K
	readonly wrapped: T
}

export interface OptionNode<T extends Node, V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<
		O.Option<ExtractModelType<T>>,
		O.Option<ExtractPartialModelType<T>>,
		Ref<O.Option<TypeOfRefs<T>>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Option'
	readonly wrapped: T
}

export interface NonEmptyArrayNode<T extends Node, V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<
		NonEmptyArray<ExtractModelType<T>>,
		NonEmptyArray<ExtractPartialModelType<T>>,
		Ref<O.Option<NonEmptyArray<TypeOfRefs<T>>>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'NonEmptyArray'
	readonly wrapped: T
}

export interface SumNode<T extends { [K in keyof T]: TypeNode<any, any, any> }, V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<
		{ [K in keyof T]: ExtractModelType<T[K]> & { __typename: T[K]['__typename'] } }[keyof T],
		{ [K in keyof T]: ExtractPartialModelType<T[K]> & { __typename?: T[K]['__typename'] } }[keyof T],
		Ref<O.Option<{ [K in keyof T]: TypeOfRefs<T[K]> }[keyof T]>>,
		V,
		{} & Intersection<
			Values<{ [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]> }>
		>
	> {
	readonly tag: 'Sum'
	readonly members: T
}

export interface MutationNode<T extends Node, V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<
		ExtractModelType<T>,
		ExtractPartialModelType<T>,
		TypeOfRefs<T>,
		V,
		{} & ExtractChildrenVariablesDefinition<T>
	> {
	readonly tag: 'Mutation'
	readonly result: T
}

export interface ScalarNode<N extends string, T, V extends VariablesDefinition = {}>
	extends NodeBaseWithProxy<T, T, Ref<O.Option<T>>, V> {
	readonly tag: 'Scalar'
	readonly name: N
}

interface NodeBaseWithProxy<
	Data,
	PartialData,
	Refs,
	Variables extends VariablesDefinition = {},
	ChildrenVariables extends VariablesDefinition = {}
>
	extends NodeBase<Data, PartialData, Refs, Variables, ChildrenVariables>,
		NodeProxy<Data, PartialData, Refs, Variables, ChildrenVariables> {
	readonly tag: string
	readonly print: Lazy<string>
}

interface NodeBase<
	Data,
	PartialData,
	Refs,
	Variables extends VariablesDefinition = {},
	ChildrenVariables extends VariablesDefinition = {}
> {
	readonly variables: NodeVariables<Variables, ChildrenVariables>
	readonly model: NodeModel<Data, PartialData, Refs>
}

interface NodeProxy<
	Data,
	PartialData,
	Refs,
	Variables extends VariablesDefinition = {},
	ChildrenVariables extends VariablesDefinition = {}
> {
	readonly data: Reader<
		DataProxyDependencies<NodeBase<Data, PartialData, Refs, Variables, ChildrenVariables>>,
		DataProxyFromNode<NodeBase<Data, PartialData, Refs, Variables, ChildrenVariables>>
	>
	readonly store: Reader<
		StoreProxyDependencies<NodeBase<Data, PartialData, Refs, Variables, ChildrenVariables>>,
		StoreProxyFromNode<NodeBase<Data, PartialData, Refs, Variables, ChildrenVariables>>
	>
}

export interface Proxy<Variables, Data, PartialData, Refs> {
	write(variables: Variables): Reader<PartialData, CacheWriteResult>
	read(selection: unknown): Reader<Variables, CacheResult<O.Option<Data>>>
	toRefs(selection: unknown): Reader<Variables, CacheResult<Refs>>
}

interface DataProxyDependencies<T extends NodeBase<any, any, any, any, any>> extends CacheNodeDependencies {
	readonly node: T
}

interface StoreProxyDependencies<T extends NodeBase<any, any, any, any, any>> extends CacheNodeDependencies {
	readonly node?: T
	readonly data?: Reader<DataProxyDependencies<T>, StoreProxyFromNode<T>>
}

interface NodeVariables<V extends VariablesDefinition = {}, MV extends VariablesDefinition = {}> {
	children: MV
	definition: V
	model: M.Model<ExtractDefinitionType<V>>
}

interface NodeModel<W, P, R> {
	whole: M.Model<W>
	partial: M.Model<P>
	__refs?: R
}

export interface VariablesDefinition {
	[K: string]: Node
}

export type ExtractModelType<T> = T extends { readonly model: NodeModel<infer A, any, any> } ? A : never

export type ExtractPartialModelType<T> = T extends { readonly model: NodeModel<any, infer A, any> } ? A : never

export type ExtractChildrenVariablesDefinition<T> = T extends { readonly variables: NodeVariables<any, infer A> }
	? A
	: never

type Values<T> = T[keyof T]

type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

export type ExtractVariablesDefinition<T> = T extends { readonly variables: NodeVariables<infer A, any> } ? A : never

export type ExtractDefinitionType<V> = {
	[K in keyof V]: ExtractModelType<V[K]>
}

type DataProxyFromNode<T extends NodeBase<any, any, any, any, any>> = Proxy<
	TypeOfChildrenVariables<T>,
	ExtractModelType<T>,
	ExtractPartialModelType<T>,
	TypeOfRefs<T>
>

type StoreProxyFromNode<T extends NodeBase<any, any, any, any, any>> = Proxy<
	TypeOfChildrenVariables<T> & TypeOfVariables<T>,
	ExtractModelType<T>,
	ExtractPartialModelType<T>,
	TypeOfRefs<T>
>

export interface CacheNodeDependencies {
	path: string
	reactivity: Reactivity
	persist?: Persist
}

class Store<T extends NodeBase<any, any, any, any, any>> implements StoreProxyFromNode<T> {
	protected readonly proxyMap: Map<unknown, DataProxyFromNode<T>> = new Map()

	constructor(
		protected readonly deps: Pick<StoreProxyDependencies<T>, 'persist'> &
			Required<Omit<StoreProxyDependencies<T>, 'persist'>>
	) {
		this.read.bind(this)
		this.write.bind(this)
		this.toRefs.bind(this)
	}

	read<Selection extends Node>(selection: Selection) {
		return (
			variables: TypeOfChildrenVariables<T> & TypeOfVariables<T>
		): CacheResult<O.Option<ExtractModelType<T>>> => {
			return this.extractProxy(this.encodeVariables(variables)).read(selection)(variables)
		}
	}

	write(
		variables: TypeOfChildrenVariables<T> & TypeOfVariables<T>
	): Reader<ExtractPartialModelType<T>, CacheResult<Evict>> {
		return this.extractProxy(this.encodeVariables(variables)).write(variables)
	}

	toRefs<Selection extends Node>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T> & TypeOfVariables<T>): CacheResult<TypeOfRefs<T>> => {
			return this.extractProxy(this.encodeVariables(variables)).toRefs(selection)(variables)
		}
	}

	protected extractProxy(encodedVariables: unknown): DataProxyFromNode<T> {
		const proxy = this.proxyMap.get(encodedVariables)
		if (proxy) {
			return proxy
		} else {
			const newProxy = this.make(encodedVariables as string)
			this.proxyMap.set(encodedVariables, newProxy)
			return newProxy
		}
	}

	protected make(path: string): DataProxyFromNode<T> {
		return this.deps.data({
			...this.deps,
			path: `${this.deps.path}-${path}`
		})
	}

	protected encodeVariables(variables: TypeOfChildrenVariables<T> & TypeOfVariables<T>): unknown {
		return this.deps.node.variables.model.encode(variables)
	}
}

class LiteralProxy<T, V extends VariablesDefinition = {}> implements Proxy<{}, T, T, Ref<O.Option<T>>> {
	readonly ref: Ref<O.Option<T>>
	constructor(deps: DataProxyDependencies<NodeBase<T, T, Ref<O.Option<T>>, V>>) {
		this.ref = deps.reactivity.shallowRef(O.none)
		this.read.bind(this)
		this.write.bind(this)
		this.toRefs.bind(this)
	}

	read() {
		return () => IOE.right(this.ref.value)
	}

	write(): Reader<T, CacheResult<Evict>> {
		return (num) =>
			pipe(
				this.read()(),
				IOE.chain((previousValue) => {
					const newValue = O.some(num)
					return pipe(
						IOE.rightIO(() => {
							this.ref.value = newValue
						}),
						IOE.apSecond(this.read()()),
						IOE.map((currentValue) => {
							return () => {
								if (newValue === currentValue) {
									this.ref.value = previousValue
								}
							}
						})
					)
				})
			)
	}

	toRefs() {
		return () => IOE.right(this.ref)
	}
}

const EMPTY_VARIABLES_MODEL = M.type({})

const EMPTY_VARIABLES: any = {}

function getVariablesModel<V extends VariablesDefinition>(
	variables: V
): M.Model<{ [K in keyof V]: ExtractModelType<V[K]> }> {
	return isEmptyObject(variables) ? (EMPTY_VARIABLES_MODEL as any) : M.type(variables)
}

export function int(): IntNode
export function int<V extends VariablesDefinition>(variables: V): IntNode<V>
export function int<V extends VariablesDefinition = {}>(variables: V = EMPTY_VARIABLES): IntNode<V> {
	const node: IntNode<V> = {
		tag: 'Int',
		variables: {
			children: EMPTY_VARIABLES,
			definition: variables,
			model: getVariablesModel(variables)
		},
		model: {
			whole: M.number,
			partial: M.number
		},
		print: constEmptyString,
		data: (deps) => new LiteralProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export function isIntNode(u: Node): u is IntNode<any> {
	return u.tag === 'Int'
}

export const staticInt = int()

export function float(): FloatNode
export function float<V extends VariablesDefinition>(variables: V): FloatNode<V>
export function float<V extends VariablesDefinition = {}>(variables: V = EMPTY_VARIABLES): FloatNode<V> {
	return {
		...int(variables),
		tag: 'Float'
	}
}

export function isFloatNode(u: Node): u is FloatNode<any> {
	return u.tag === 'Float'
}

export const staticFloat = float()

export function string(): StringNode
export function string<V extends VariablesDefinition>(variables: V): StringNode<V>
export function string<V extends VariablesDefinition = {}>(variables: V = EMPTY_VARIABLES): StringNode<V> {
	const node: StringNode<V> = {
		tag: 'String',
		variables: {
			children: EMPTY_VARIABLES,
			definition: variables,
			model: getVariablesModel(variables)
		},
		model: {
			whole: M.string,
			partial: M.string
		},
		print: constEmptyString,
		data: (deps) => new LiteralProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export const staticString = string()

export function isStringNode(u: Node): u is StringNode {
	return u.tag === 'String'
}

export function boolean(): BooleanNode
export function boolean<V extends VariablesDefinition>(variables: V): BooleanNode<V>
export function boolean<V extends VariablesDefinition = {}>(variables: V = EMPTY_VARIABLES): BooleanNode<V> {
	const node: BooleanNode<V> = {
		tag: 'Boolean',
		variables: {
			children: EMPTY_VARIABLES,
			definition: variables,
			model: getVariablesModel(variables)
		},
		model: {
			whole: M.boolean,
			partial: M.boolean
		},
		print: constEmptyString,
		data: (deps) => new LiteralProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export const staticBoolean = boolean()

export function isBooleanNode(u: Node): u is BooleanNode {
	return u.tag === 'Boolean'
}

export function isPrimitiveNode(u: Node): u is PrimitiveNode {
	return isIntNode(u) || isFloatNode(u) || isStringNode(u) || isBooleanNode(u)
}

export function scalar<N extends string, T>(name: N, model: M.Model<T>): ScalarNode<N, T>
export function scalar<N extends string, T, V extends VariablesDefinition>(
	name: N,
	model: M.Model<T>,
	variables: V
): ScalarNode<N, T, V>
export function scalar<N extends string, T, V extends VariablesDefinition = {}>(
	name: N,
	model: M.Model<T>,
	variables: V = EMPTY_VARIABLES
): ScalarNode<N, T, V> {
	const node: ScalarNode<N, T, V> = {
		model: {
			whole: model,
			partial: model
		},
		variables: {
			children: EMPTY_VARIABLES,
			definition: variables,
			model: getVariablesModel(variables)
		},
		name,
		tag: 'Scalar',
		print: constEmptyString,
		data: (deps) => new LiteralProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export function isScalarNode(x: Node): x is ScalarNode<string, any> {
	return x.tag === 'Scalar'
}

const recordTraverse = traverseWithIndex(cacheErrorApplicativeValidation)

abstract class BaseProxy<T extends NodeBase<any, any, any, any, any>> implements DataProxyFromNode<T> {
	protected constructor(
		protected readonly deps: Pick<DataProxyDependencies<T>, 'persist'> &
			Required<Omit<DataProxyDependencies<T>, 'persist'>>
	) {
		this.read.bind(this)
		this.write.bind(this)
		this.toRefs.bind(this)
	}
	abstract read(selection: unknown): Reader<TypeOfChildrenVariables<T>, CacheResult<O.Option<ExtractModelType<T>>>>

	abstract toRefs(selection: unknown): Reader<TypeOfChildrenVariables<T>, CacheResult<TypeOfRefs<T>>>

	abstract write(variables: TypeOfChildrenVariables<T>): Reader<ExtractPartialModelType<T>, CacheWriteResult>
}

class TypeProxy<T extends TypeNode<any, any, any>> extends BaseProxy<T> {
	readonly proxy: { [K in keyof T['members']]: StoreProxyFromNode<T['members'][K]> } & {
		__typename: Proxy<{}, T['__typename'], T['__typename'], T['__typename']>
	}
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
		this.proxy = this.getProxy()
	}
	read<Selection extends TypeNode<any, any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<O.Option<ExtractModelType<T>>> => {
			return pipe(
				selection.members as Record<keyof T, any>,
				recordTraverse((k, _) => this.proxy[k as keyof T].read(selection.members[k])(variables as any)),
				IOE.map(sequence(O.option))
			) as CacheResult<O.Option<ExtractModelType<T>>>
		}
	}

	write(variables: TypeOfChildrenVariables<T>): Reader<ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			let proxyWrite: CacheWriteResult = cacheWriteResultMonoid.empty
			for (const key in data) {
				proxyWrite = cacheWriteResultMonoid.concat(
					proxyWrite,
					this.proxy[key].write(variables as any)(data[key] as any)
				)
			}
			return proxyWrite
		}
	}

	toRefs<Selection extends TypeNode<any, any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<TypeOfRefs<T>> => {
			return pipe(
				selection as Record<keyof T, any>,
				recordTraverse((k, _) => this.proxy[k as keyof T].toRefs(selection.members[k])(variables as any))
			) as CacheResult<TypeOfRefs<T>>
		}
	}

	private getProxy() {
		const proxy: Partial<
			{ [K in keyof T['members']]: StoreProxyFromNode<T['members'][K]> } & {
				__typename: Proxy<{}, T['__typename'], T['__typename'], T['__typename']>
			}
		> = {}
		const members = this.deps.node.members
		for (const key in members) {
			const member = members[key]
			proxy[key as keyof T['members']] = member.store({
				...this.deps,
				path: `${this.deps.path}.${this.deps.node.__typename}.${key}`,
				node: member
			}) as any
		}
		proxy.__typename = getTypenameProxy<T['__typename']>(this.deps.node.__typename) as any
		return proxy as { [K in keyof T['members']]: StoreProxyFromNode<T['members'][K]> } & {
			__typename: Proxy<{}, T['__typename'], T['__typename'], T['__typename']>
		}
	}
}

function getTypenameProxy<T extends string>(__typename: T): Proxy<{}, T, T, T> {
	return {
		read: () => () => IOE.right(O.some(__typename)),
		write: () => () => IOE.right(constVoid),
		toRefs: () => () => IOE.right(__typename)
	}
}

function extractTypeChildrenVariables<T extends { [K in keyof T]: Node }>(
	members: T
): {} & Intersection<
	Values<{ [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]> }>
> {
	const x: any = {}
	Object.keys(members).forEach((key) => {
		for (const [k, v] of Object.entries(members[key as keyof T].variables.children)) {
			if (x[k] !== undefined) {
				console.warn(
					`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
				)
			}
			x[k] = v
		}

		for (const [k, v] of Object.entries(members[key as keyof T].variables.definition)) {
			if (x[k] !== undefined) {
				console.warn(
					`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
				)
			}
			x[k] = v
		}
	})
	return x
}

function extractTypeMemberModels<T extends { [K in keyof T]: Node }>(members: T): { [K in keyof T]: T[K]['model'] } {
	const x: any = {}
	Object.keys(members).forEach((key) => {
		x[key as keyof T] = members[key as keyof T].model
	})
	return x
}

function printVariablesNode<V extends VariablesDefinition>(variables: V): string {
	const tokens: string[] = [OPEN_PAREN]
	const keys = Object.keys(variables)
	const length = keys.length
	const last = length - 1
	let i = 0
	for (; i < length; i++) {
		const key = keys[i]
		tokens.push(key, COLON, OPEN_SPACE, DOLLAR_SIGN, key, i === last ? '' : ', ')
	}
	tokens.push(CLOSE_PAREN)
	return tokens.join('')
}

function printTypeNodeMembers(members: { [K: string]: Node }): Lazy<string> {
	return () => {
		const tokens: string[] = [OPEN_BRACKET, OPEN_SPACE]
		for (const [key, value] of Object.entries(members)) {
			tokens.push(key)
			if (!isEmptyObject(value.variables.definition)) {
				tokens.push(printVariablesNode(value.variables.definition))
			}
			const val = value.print()
			tokens.push(...(isEmptyString(val) ? [OPEN_SPACE] : [OPEN_SPACE, val, OPEN_SPACE]))
		}
		tokens.push(CLOSE_BRACKET)
		return tokens.join('')
	}
}

export function type<N extends string, T extends { [K in keyof T]: Node }>(__typename: N, members: T): TypeNode<N, T>
export function type<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesDefinition>(
	__typename: N,
	members: T,
	variables: V
): TypeNode<N, T, V>
export function type<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesDefinition = {}>(
	__typename: N,
	members: T,
	variables: V = EMPTY_VARIABLES
): TypeNode<N, T, V> {
	const models = extractTypeMemberModels(members) as any
	const node: TypeNode<N, T, V> = {
		__typename,
		tag: 'Type',
		members,
		model: {
			whole: M.type(models),
			partial: M.partial(models)
		},
		variables: {
			children: extractTypeChildrenVariables(members),
			model: getVariablesModel(variables),
			definition: variables
		},
		print: printTypeNodeMembers(members),
		data: (deps) => new TypeProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export function isTypeNode(u: Node): u is TypeNode<any, any, any> {
	return u.tag === 'Type'
}

export function schema<N extends string, T extends { [K in keyof T]: Node }>(
	__typename: N,
	members: T
): TypeNode<N, T> {
	return type(__typename, members)
}

export function isSchemaNode(u: Node): u is SchemaNode<any, any> {
	return isTypeNode(u) && isEmptyObject(u.variables.definition)
}

const withMap = MAP.getWitherable(fromCompare(constant(0)))

const traverseMapCacheResult = withMap.traverse(cacheErrorApplicativeValidation)

const traverseWithIndexMapCacheResult = withMap.traverseWithIndex(cacheErrorApplicativeValidation as any)

const sequenceMapOption = withMap.sequence(O.option)

class MapProxy<T extends MapNode<any, any, any>> extends BaseProxy<T> {
	readonly proxy: Map<ExtractModelType<T['key']>, StoreProxyFromNode<T['wrapped']>>
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
		this.proxy = deps.reactivity.shallowReactive(new Map())
	}

	read<Selection extends MapNode<any, any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<O.Option<ExtractModelType<T>>> => {
			return pipe(
				IOE.rightIO(() => this.proxy),
				IOE.chain((p) => traverseMapCacheResult(p, (m) => m.read(selection.wrapped)(variables as any))),
				IOE.map(sequenceMapOption)
			) as CacheResult<O.Option<ExtractModelType<T>>>
		}
	}

	write(variables: TypeOfChildrenVariables<T>): Reader<ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return traverseWithIndexMapCacheResult<
				ExtractPartialModelType<T>,
				ExtractModelType<T['key']>,
				CacheError,
				Evict
			>(
				data as Map<unknown, ExtractPartialModelType<T>>,
				((k: ExtractModelType<T['key']>, v: ExtractPartialModelType<T['wrapped']>) => {
					if (v === null || v === undefined) {
						return pipe(
							IOE.rightIO(this.getProxy(k as ExtractModelType<T['key']>)),
							IOE.chain(p => IOE.rightIO(() => {
								this.proxy.delete(k);
								return () => { this.proxy.set(k, p); }
							}))
						);
					} else {
						return pipe(
							IOE.rightIO(this.getProxy(k as ExtractModelType<T['key']>)),
							IOE.chain((p) => p.write(variables as any)(v))
						)
					}
				}) as any
			)
		}
	}

	toRefs<Selection extends MapNode<any, any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<TypeOfRefs<T>> => {
			return IOE.rightIO(() =>
				this.deps.reactivity.computed(() => {
					return pipe(
						traverseMapCacheResult(this.proxy, (m) => m.toRefs(selection.wrapped)(variables as any)),
						IOE.getOrElse<CacheError, Map<unknown, TypeOfRefs<T['wrapped']>>>(constant(constMap))
					)()
				})
			) as CacheResult<TypeOfRefs<T>>
		}
	}

	private getProxy(key: ExtractModelType<T['key']>): IO<StoreProxyFromNode<T['wrapped']>> {
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

function mergeVariablesDefinitionWithChildren<T extends Node>(
	node: T
): ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T> {
	const x: any = {}
	for (const [k, v] of Object.entries(node.variables.children)) {
		if (x[k] !== undefined) {
			console.warn(
				`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
			)
		}
		x[k] = v
	}
	for (const [k, v] of Object.entries(node.variables.definition)) {
		if (x[k] !== undefined) {
			console.warn(
				`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
			)
		}
		x[k] = v
	}
	return x
}

export function map<K extends Node, T extends Node>(key: K, value: T): MapNode<K, T>
export function map<K extends Node, T extends Node, V extends VariablesDefinition>(
	key: K,
	value: T,
	variables: V
): MapNode<K, T, V>
export function map<K extends Node, T extends Node, V extends VariablesDefinition = {}>(
	key: K,
	value: T,
	variables: V = EMPTY_VARIABLES
): MapNode<K, T, V> {
	const node: MapNode<K, T, V> = {
		tag: 'Map',
		model: {
			whole: M.map(key.model.whole, value.model.whole),
			partial: M.map(key.model.whole, value.model.partial)
		},
		key,
		wrapped: value,
		variables: {
			children: mergeVariablesDefinitionWithChildren(value),
			definition: variables,
			model: getVariablesModel(variables)
		},
		print: value.print,
		data: (deps) => new MapProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export function isMapNode(u: Node): u is MapNode<any, any> {
	return u.tag === 'Map'
}

class ArrayProxy<T extends ArrayNode<any, any>> extends BaseProxy<T> {
	proxy: Ref<StoreProxyFromNode<T['wrapped']>[]>
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
		this.proxy = deps.reactivity.shallowRef([])
	}

	read<Selection extends ArrayNode<any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<O.Option<ExtractModelType<T>>> => {
			return pipe(
				IOE.rightIO(() => this.proxy.value),
				IOE.chain((p) =>
					A.array.traverse(cacheErrorApplicativeValidation)(p, (m) =>
						m.read(selection.wrapped)(variables as any)
					)
				),
				IOE.map(A.array.sequence(O.option))
			) as CacheResult<O.Option<ExtractModelType<T>>>
		}
	}

	write(variables: TypeOfChildrenVariables<T>): Reader<ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return pipe(
				IOE.rightIO(this.getProxy(data)),
				IOE.chain((proxy) =>
					A.array.traverseWithIndex(cacheErrorApplicativeValidation)(proxy, (i, a) => {
						return a.write(variables as any)((data as any)[i])
					})
				),
				IOE.map(A.reduce(taskVoid, concatEvict))
			)
		}
	}

	toRefs<Selection extends ArrayNode<any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<TypeOfRefs<T>> => {
			return IOE.rightIO(
				() =>
					this.deps.reactivity.computed(() => {
						return pipe(
							A.array.traverse(cacheErrorApplicativeValidation)(this.proxy.value, (m) =>
								m.toRefs(selection.wrapped)(variables as any)
							),
							IOE.getOrElse<CacheError, Array<TypeOfRefs<T['wrapped']>>>(constant(constEmptyArray))
						)()
					}) as TypeOfRefs<T>
			)
		}
	}

	private getProxy(data: ExtractPartialModelType<T>): IO<StoreProxyFromNode<T['wrapped']>[]> {
		return () => {
			const newProxy = data.map((_, index) =>
				this.deps.node.wrapped.store({
					...this.deps,
					path: `${this.deps.path}[${index}]`,
					node: this.deps.node.wrapped
				})
			)
			this.proxy.value = newProxy
			return newProxy
		}
	}
}

export function array<T extends Node>(wrapped: T): ArrayNode<T>
export function array<T extends Node, V extends VariablesDefinition>(wrapped: T, variables: V): ArrayNode<T, V>
export function array<T extends Node, V extends VariablesDefinition = {}>(
	wrapped: T,
	variables: V = EMPTY_VARIABLES
): ArrayNode<T, V> {
	const node: ArrayNode<T, V> = {
		tag: 'Array',
		wrapped,
		model: {
			whole: M.array(wrapped.model.whole),
			partial: M.array(wrapped.model.partial)
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(wrapped),
			definition: variables,
			model: getVariablesModel(variables)
		},

		print: wrapped.print,
		data: (deps) => new ArrayProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export function isArrayNode(u: Node): u is ArrayNode<any> {
	return u.tag === 'Array'
}

class SumProxy<T extends SumNode<any, any>> extends BaseProxy<T> {
	type: Ref<O.Option<keyof T['members']>>
	proxy: Ref<O.Option<{ [K in keyof T['members']]: StoreProxyFromNode<T['members'][K]> }[keyof T['members']]>>
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
		this.type = deps.reactivity.shallowRef(O.none)
		this.proxy = deps.reactivity.shallowRef(O.none)
	}

	read<Selection extends SumNode<any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<O.Option<ExtractModelType<T>>> => {
			return pipe(
				IOE.rightIO(() => optionSequenceT(this.proxy.value, this.type.value)),
				IOE.chain(
					O.fold(constant(IOE.right(O.none)), ([p, t]) => p.read(selection.members[t])(variables as any))
				)
			)
		}
	}

	write(variables: TypeOfChildrenVariables<T>): Reader<ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return pipe(
				IOE.rightIO(this.getProxy(data)),
				IOE.chain(O.fold(constant(IOE.right(taskVoid)), (p) => p.write(variables as any)(data)))
			)
		}
	}

	toRefs<Selection extends SumNode<any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<TypeOfRefs<T>> => {
			return IOE.rightIO(() => {
				return this.deps.reactivity.computed(() => {
					return pipe(
						optionSequenceT(this.proxy.value, this.type.value),
						O.fold(constant(IOE.right(O.none)), ([p, k]) =>
							pipe(p.toRefs(selection.members[k])(variables as any), IOE.map(O.some))
						),
						IOE.getOrElse<CacheError, O.Option<{ [K in keyof T]: TypeOfRefs<T[K]> }[keyof T]>>(
							constant(constNone)
						)
					)()
				})
			}) as CacheResult<TypeOfRefs<T>>
		}
	}

	private getProxy(
		data: ExtractPartialModelType<T>
	): IO<O.Option<{ [K in keyof T['members']]: StoreProxyFromNode<T['members'][K]> }[keyof T['members']]>> {
		return () => {
			const members = this.deps.node.members
			for (const k in members) {
				const member = members[k]
				if (member.model.partial.is(data)) {
					const newProxy = O.some(
						member.store({ ...this.deps, path: `${this.deps.path}-${k}`, node: member })
					)
					this.type.value = O.some(k)
					this.proxy.value = newProxy
					return newProxy
				}
			}
			return this.proxy.value
		}
	}
}

function getSumModel<T extends { [K in keyof T]: TypeNode<string, any> }>(
	members: T
): M.Model<{ [K in keyof T]: ExtractModelType<T[K]> & { __typename: T[K]['__typename'] } }[keyof T]> {
	const m: any = {}
	Object.keys(m).forEach((key) => {
		const sumNode = members[key as keyof T]
		m[sumNode.__typename] = M.type({
			__typename: M.literal(sumNode.__typename),
			...extractTypeMemberModels(sumNode.members)
		})
	})
	return M.sum('__typename')(m) as any
}

function getSumPartialModel<T extends { [K in keyof T]: TypeNode<string, any> }>(
	members: T
): M.Model<{ [K in keyof T]: ExtractPartialModelType<T[K]> & { __typename?: T[K]['__typename'] } }[keyof T]> {
	const m: any = {}
	Object.keys(m).forEach((key) => {
		const sumNode = members[key as keyof T]
		m[sumNode.__typename] = M.partial({
			__typename: M.literal(sumNode.__typename),
			...extractTypeMemberModels(sumNode.members)
		})
	})
	return M.sum('__typename')(m) as any
}

function printSumNode<T extends { [K in keyof T]: TypeNode<string, any> }>(members: T): Lazy<string> {
	return () => {
		const tokens: string[] = [OPEN_BRACKET, TYPENAME]
		Object.keys(members).forEach((key) => {
			const n = members[key as keyof T]
			tokens.push(
				ELLIPSIS,
				OPEN_SPACE,
				ON,
				OPEN_SPACE,
				n.__typename,
				OPEN_SPACE,
				printTypeNodeMembers(n.members)()
			)
		})
		tokens.push(CLOSE_BRACKET)
		return tokens.join('')
	}
}

export function sum<T extends { [K in keyof T]: TypeNode<any, any, any> }>(members: T): SumNode<T>
export function sum<T extends { [K in keyof T]: TypeNode<any, any, any> }, V extends VariablesDefinition>(
	members: T,
	variables: V
): SumNode<T, V>
export function sum<T extends { [K in keyof T]: TypeNode<any, any, any> }, V extends VariablesDefinition = {}>(
	members: T,
	variables: V = EMPTY_VARIABLES
): SumNode<T, V> {
	const node: SumNode<T, V> = {
		tag: 'Sum',
		model: {
			whole: getSumModel(members),
			partial: getSumPartialModel(members)
		},
		print: printSumNode(members),
		members,
		variables: {
			children: extractTypeChildrenVariables(members),
			definition: variables,
			model: getVariablesModel(variables)
		},
		data: (deps) => new SumProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export function isSumNode(x: Node): x is SumNode<any, any> {
	return x.tag === 'Sum'
}

const optionSequenceT = sequenceT(O.option)

class OptionProxy<T extends OptionNode<any, any>> extends BaseProxy<T> {
	proxy: Ref<O.Option<StoreProxyFromNode<T>>>
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
		this.proxy = deps.reactivity.shallowRef(O.none)
	}

	read<Selection extends OptionNode<any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<O.Option<ExtractModelType<T>>> => {
			return pipe(
				IOE.rightIO(() => this.proxy.value),
				IOE.chain(O.fold(constant(IOE.right(O.none)), (p) => p.read(selection.wrapped)(variables as any)))
			)
		}
	}

	write(variables: TypeOfChildrenVariables<T>): Reader<ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return pipe(
				IOE.rightIO(this.getProxy(data)),
				IOE.chain((oProxy) =>
					pipe(
						optionSequenceT(oProxy, data),
						O.fold(constant(IOE.right(taskVoid)), ([proxy, data]) =>
							proxy.write(variables as any)(data as ExtractPartialModelType<T>)
						)
					)
				)
			)
		}
	}

	toRefs<Selection extends OptionNode<any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<TypeOfRefs<T>> => {
			return IOE.rightIO(() =>
				this.deps.reactivity.computed(() => {
					return pipe(
						this.proxy.value,
						O.fold(constant(IOE.right(O.none)), (p) =>
							pipe(p.toRefs(selection.wrapped)(variables as any), IOE.map(O.some))
						),
						IOE.getOrElse<CacheError, O.Option<TypeOfRefs<T['wrapped']>>>(constant(constNone))
					)()
				})
			) as CacheResult<TypeOfRefs<T>>
		}
	}

	private getProxy(data: ExtractPartialModelType<T>): IO<O.Option<StoreProxyFromNode<T>>> {
		return () => {
			if (O.isSome(data) && O.isSome(this.proxy.value)) {
				return this.proxy.value
			} else if (O.isSome(data) && O.isNone(this.proxy.value)) {
				const newProxy = O.some(
					this.deps.node.wrapped.store({
						...this.deps,
						path: `${this.deps.path}.value`,
						node: this.deps.node.wrapped
					})
				)
				this.proxy.value = newProxy
				return newProxy
			} else if (O.isSome(this.proxy.value) && O.isNone(data)) {
				this.proxy.value = O.none
				return O.none
			} else {
				return O.none
			}
		}
	}
}

export function option<T extends Node>(wrapped: T): OptionNode<T>
export function option<T extends Node, V extends VariablesDefinition>(wrapped: T, variables: V): OptionNode<T, V>
export function option<T extends Node, V extends VariablesDefinition = {}>(
	wrapped: T,
	variables: V = EMPTY_VARIABLES
): OptionNode<T, V> {
	const node: OptionNode<T, V> = {
		tag: 'Option',
		wrapped,
		model: {
			whole: M.option(wrapped.model.whole),
			partial: M.option(wrapped.model.partial)
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(wrapped),
			model: getVariablesModel(variables),
			definition: variables
		},
		print: wrapped.print,
		data: (deps) => new OptionProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export function isOptionNode(u: Node): u is OptionNode<any> {
	return u.tag === 'Option'
}

class NonEmptyArrayProxy<T extends NonEmptyArrayNode<any, any>> extends BaseProxy<T> {
	proxy: Ref<StoreProxyFromNode<T['wrapped']>[]>
	constructor(deps: Pick<DataProxyDependencies<T>, 'persist'> & Required<Omit<DataProxyDependencies<T>, 'persist'>>) {
		super(deps)
		this.proxy = deps.reactivity.shallowRef([])
	}

	read<Selection extends NonEmptyArrayNode<any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<O.Option<ExtractModelType<T>>> => {
			return pipe(
				IOE.rightIO(() => this.proxy.value),
				IOE.chain((p) =>
					A.array.traverse(cacheErrorApplicativeValidation)(p, (m) =>
						m.read(selection.wrapped)(variables as any)
					)
				),
				IOE.map((results) =>
					pipe(
						results,
						A.array.sequence(O.option),
						O.chain((value) => (A.isNonEmpty(value) ? O.some(value) : O.none))
					)
				)
			) as CacheResult<O.Option<ExtractModelType<T>>>
		}
	}
	write(variables: TypeOfChildrenVariables<T>): Reader<ExtractPartialModelType<T>, CacheWriteResult> {
		return (data) => {
			return pipe(
				IOE.rightIO(this.getProxy(data)),
				IOE.chain((proxy) =>
					A.array.traverseWithIndex(cacheErrorApplicativeValidation)(proxy, (i, a) => {
						return a.write(variables as any)((data as any)[i])
					})
				),
				IOE.map(A.reduce(taskVoid, concatEvict))
			)
		}
	}

	toRefs<Selection extends NonEmptyArrayNode<any, any>>(selection: Selection) {
		return (variables: TypeOfChildrenVariables<T>): CacheResult<TypeOfRefs<T>> => {
			return IOE.rightIO(() =>
				this.deps.reactivity.computed(() => {
					return pipe(
						IOE.rightIO(() => this.proxy.value),
						IOE.chain((p) =>
							A.array.traverse(cacheErrorApplicativeValidation)(p, (m) =>
								m.toRefs(selection.wrapped)(variables as any)
							)
						),
						IOE.fold<CacheError, Array<TypeOfRefs<T>>, O.Option<NonEmptyArray<TypeOfRefs<T>>>>(
							constant(constNone),
							(as) => () => (A.isNonEmpty(as) ? O.some(as) : O.none)
						)
					)()
				})
			) as CacheResult<TypeOfRefs<T>>
		}
	}

	private getProxy(data: ExtractPartialModelType<T>): IO<StoreProxyFromNode<T['wrapped']>[]> {
		return () => {
			const newProxy = data.map((_, index) =>
				this.deps.node.wrapped.store({
					...this.deps,
					path: `${this.deps.path}[${index}]`,
					node: this.deps.node.wrapped
				})
			)
			this.proxy.value = newProxy
			return newProxy
		}
	}
}

export function nonEmptyArray<T extends Node>(wrapped: T): NonEmptyArrayNode<T>
export function nonEmptyArray<T extends Node, V extends VariablesDefinition>(
	wrapped: T,
	variables: V
): NonEmptyArrayNode<T, V>
export function nonEmptyArray<T extends Node, V extends VariablesDefinition = {}>(
	wrapped: T,
	variables: V = EMPTY_VARIABLES
): NonEmptyArrayNode<T, V> {
	const node: NonEmptyArrayNode<T, V> = {
		tag: 'NonEmptyArray',
		wrapped,
		model: {
			whole: M.nonEmptyArray(wrapped.model.whole),
			partial: M.nonEmptyArray(wrapped.model.partial)
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(wrapped),
			definition: variables,
			model: getVariablesModel(variables)
		},
		print: wrapped.print,
		data: (deps) => new NonEmptyArrayProxy({ ...deps, node }),
		store: (deps) =>
			isEmptyObject(variables)
				? node.data({ ...deps, node: deps.node || node })
				: new Store({ ...deps, data: node.data, node: deps.node || node })
	}
	return node
}

export function isNonEmptyArrayNode(u: Node): u is NonEmptyArrayNode<any, any> {
	return u.tag === 'NonEmptyArray'
}

export function isWrappedNode(x: Node): x is WrappedNode {
	const tag = x.tag
	return tag === 'Map' || tag === 'Option' || tag === 'Array' || tag === 'NonEmptyArray'
}

const EMPTY_PROXY_ERROR: CacheResult<any> = IOE.left([tree('no proxy exists for this node')])

const CONST_EMPTY_PROXY_ERROR = constant(constant(EMPTY_PROXY_ERROR))

const EMPTY_PROXY: Proxy<any, any, any, any> = {
	write: CONST_EMPTY_PROXY_ERROR,
	read: CONST_EMPTY_PROXY_ERROR,
	toRefs: CONST_EMPTY_PROXY_ERROR
}

const CONST_EMPTY_PROXY = constant(EMPTY_PROXY)

export function mutation<T extends Node>(result: T): MutationNode<T>
export function mutation<T extends Node, V extends VariablesDefinition>(result: T, variables: V): MutationNode<T, V>
export function mutation<T extends Node, V extends VariablesDefinition = {}>(
	result: T,
	variables: V = EMPTY_VARIABLES
): MutationNode<T, V> {
	const node = {
		tag: 'Mutation' as const,
		result: result,
		model: {
			whole: result.model.whole as ExtractModelType<T>,
			partial: result.model.partial as ExtractPartialModelType<T>
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(result),
			model: getVariablesModel(variables),
			definition: variables
		},
		print: result.print,
		data: CONST_EMPTY_PROXY,
		store: CONST_EMPTY_PROXY
	}
	return node
}

export function isMutationNode(u: Node): u is MutationNode<any, any> {
	return u.tag === 'Mutation'
}

function printVariables<V extends VariablesDefinition>(variables: V): string {
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
			return `[${printVariableName(node.wrapped, isOptionNode(node.wrapped))}]${optionalString}`
		case 'Map':
			return `Map[${printVariableName(node.key)}, ${printVariableName(
				node.wrapped,
				isOptionNode(node.wrapped)
			)}]${optionalString}`
		case 'Option':
			return printVariableName(node.wrapped, true)
		case 'Boolean':
		case 'String':
		case 'Int':
		case 'Float':
			return `${node.tag}${optionalString}`
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
): string {
	const tokens = [operation, ' ', operationName]
	if (!isEmptyObject(schema.variables.children)) {
		tokens.push(printVariables(schema.variables.children))
	}
	tokens.push(OPEN_SPACE, schema.print())
	return tokens.join('')
}

export function pickFromType<
	Name extends string,
	T extends { [K in keyof T]: Node },
	V extends VariablesDefinition,
	P extends keyof T
>(node: TypeNode<Name, T, V>, ...keys: P[]): TypeNode<Name, Pick<T, P>, V> {
	const n: any = {}
	keys.forEach((k) => {
		n[k] = node.members[k]
	})
	return type(node.__typename, n, node.variables.definition)
}

export function omitFromType<
	Name extends string,
	T extends { [K in keyof T]: Node },
	V extends VariablesDefinition,
	P extends keyof T
>(node: TypeNode<Name, T, V>, ...keys: P[]): TypeNode<Name, Omit<T, P>, V> {
	const n: any = {}
	const members = node.members
	Object.keys(members).forEach((k) => {
		if (!keys.includes(k as P)) {
			n[k] = members[k as keyof T]
		}
	})
	return type(node.__typename, n, node.variables.definition)
}

export const showNode: Show<Node> = {
	show: (node) => {
		switch (node.tag) {
			case 'Boolean':
			case 'Int':
			case 'Float':
			case 'String':
				return node.tag
			case 'Scalar':
				return `Scalar: ${node.name}`
			case 'Map':
				return `Map<${showNode.show(node.key)}, ${showNode.show(node.wrapped)}>`
			case 'Option':
				return `Option<${showNode.show(node.wrapped)}>`
			case 'Array':
				return `Array<${showNode.show(node.wrapped)}`
			case 'NonEmptyArray':
				return `NonEmptyArray<${showNode.show(node.wrapped)}`
			case 'Sum':
				return showSumNode.show(node)
			case 'Type':
				return showTypeNode.show(node)
			default:
				return node.tag
		}
	}
}

export const showSumNode: Show<SumNode<any>> = {
	show: (node) =>
		`{ ${Object.keys(node.members)
			.map((k) => `${k}: ${node.members[k].__typename}`)
			.join(', ')} }`
}

export const showTypeNode: Show<TypeNode<string, any, any>> = {
	show: (node) =>
		`{ ${Object.keys(node.members)
			.map((k) =>
				`${k}: ${node.members[k].tag} ${node.members[k].__typename || node.members[k].name || ''}`.trimEnd()
			)
			.join(', ')} }`
}
