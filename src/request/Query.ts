import { FunctionN, Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option } from 'fp-ts/lib/Option'
import { Show } from 'fp-ts/lib/Show'
import * as M from '../model/Model'
import { constEmptyString, isEmptyObject, once, Ref } from '../shared'

export interface DocumentNode<
	ModelType,
	PartialModelType,
	StoreType,
	RefType,
	V extends VariablesNode = {},
	MV extends VariablesNode = {}
> {
	readonly __mergedVariables?: MV
	readonly tag: string
	readonly model: M.Model<ModelType>
	readonly partialModel: M.Model<PartialModelType>
	readonly print: Lazy<string>
	readonly variables: V
	readonly variablesModel: M.Model<ExtractVariables<V>>
}

export type Node =
	| LiteralNode<any>
	| TypeNode<string, any, any>
	| WrappedNode<any>
	| SumNode<any, any>
	| ScalarNode<string, any, any>
	| MutationNode<any>
	| Schema<any>

export interface Schema<T extends { [K in keyof T]: Node }>
	extends DocumentNode<
		{ [K in keyof T]: ExtractModelType<T[K]> },
		Partial<{ [K in keyof T]: ExtractModelType<T[K]> }>,
		Store<{ [K in keyof T]: ExtractStoreType<T[K]> }, {}>,
		Ref<{ [K in keyof T]: ExtractRefType<T[K]> }>,
		{},
		{} & Intersection<Values<{ [K in keyof T]: ExtractMergedVariables<T[K]> }>>
	> {
	readonly tag: 'Schema'
	readonly members: T
}

export type LiteralNode<V extends VariablesNode = {}> = StringNode<V> | BooleanNode<V> | NumberNode<V>

export interface StringNode<V extends VariablesNode = {}>
	extends DocumentNode<string, string, Store<string, V>, Ref<string>, V> {
	readonly tag: 'String'
}

export interface BooleanNode<V extends VariablesNode = {}>
	extends DocumentNode<boolean, boolean, Store<boolean, V>, Ref<boolean>, V> {
	readonly tag: 'Boolean'
}

export interface NumberNode<V extends VariablesNode = {}>
	extends DocumentNode<number, number, Store<number, V>, Ref<number>, V> {
	readonly tag: 'Number'
}

export interface TypeNode<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesNode = {}>
	extends DocumentNode<
		{ [K in keyof T]: ExtractModelType<T[K]> },
		Partial<{ [K in keyof T]: ExtractModelType<T[K]> }>,
		Store<{ [K in keyof T]: ExtractStoreType<T[K]> }, V>,
		Ref<{ [K in keyof T]: ExtractRefType<T[K]> }>,
		V,
		V & Intersection<Values<{ [K in keyof T]: ExtractMergedVariables<T[K]> }>>
	> {
	readonly __typename: N
	readonly tag: 'Type'
	readonly members: T
}

export type WrappedNode<T extends Node> =
	| ArrayNode<T, any>
	| MapNode<T, any, any>
	| OptionNode<T, any>
	| NonEmptyArrayNode<T, any>

export interface ArrayNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		ExtractModelType<T>[],
		ExtractPartialModelType<T>[],
		Store<ExtractStoreType<T>[], V>,
		Ref<ExtractRefType<T>[]>,
		V,
		V & ExtractMergedVariables<T>
	> {
	readonly tag: 'Array'
	readonly wrapped: T
}

export interface MapNode<T extends Node, V extends VariablesNode = {}, K extends Node = StringNode>
	extends DocumentNode<
		Map<ExtractModelType<K>, ExtractModelType<T>>,
		Map<ExtractModelType<K>, ExtractPartialModelType<T>>,
		Store<Map<unknown, ExtractStoreType<T>>, V>,
		Ref<Map<unknown, ExtractRefType<T>>>,
		V,
		V & ExtractMergedVariables<T>
	> {
	readonly tag: 'Map'
	readonly key: K
	readonly wrapped: T
}

export interface OptionNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		Option<ExtractModelType<T>>,
		Option<ExtractPartialModelType<T>>,
		Store<Option<ExtractStoreType<T>>, V>,
		Ref<Option<ExtractRefType<T>>>,
		V,
		V & ExtractMergedVariables<T>
	> {
	readonly tag: 'Option'
	readonly wrapped: T
}

export interface NonEmptyArrayNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		NonEmptyArray<ExtractModelType<T>>,
		NonEmptyArray<ExtractPartialModelType<T>>,
		Store<NonEmptyArray<ExtractStoreType<T>>, V>,
		Ref<NonEmptyArray<ExtractRefType<T>>>,
		V,
		V & ExtractMergedVariables<T>
	> {
	readonly tag: 'NonEmptyArray'
	readonly wrapped: T
}

export interface SumNode<T extends { [K in keyof T]: TypeNode<string, any> }, V extends VariablesNode = {}>
	extends DocumentNode<
		{ [K in keyof T]: ExtractModelType<T[K]> }[keyof T],
		{ [K in keyof T]: ExtractPartialModelType<T[K]> }[keyof T],
		Store<{ [K in keyof T]: ExtractStoreType<T[K]> }[keyof T], V>,
		Ref<{ [K in keyof T]: ExtractRefType<T[K]> }[keyof T]>,
		V,
		V & Intersection<Values<{ [K in keyof T]: ExtractMergedVariables<T[K]> }>>
	> {
	readonly tag: 'Sum'
	readonly members: T
}

export interface MutationNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		ExtractModelType<T>,
		ExtractPartialModelType<T>,
		ExtractStoreType<T>,
		ExtractRefType<T>,
		V,
		ExtractMergedVariables<T>
	> {
	readonly tag: 'Mutation'
}

export interface ScalarNode<N extends string, T, V extends VariablesNode = {}>
	extends DocumentNode<T, T, Store<T, V>, Ref<T>, V> {
	readonly tag: 'Scalar'
	readonly name: N
}

export type ExtractModelType<T> = T extends { readonly model: M.Model<infer A> } ? A : never

export type ExtractPartialModelType<T> = T extends { readonly partialModel: M.Model<infer A> } ? A : never

export type ExtractStoreType<T> = T extends Node ? Exclude<T['store'], undefined> : never

export type ExtractRefType<T> = T extends Node ? Exclude<T['__refType'], undefined> : never

export type ExtractStoreRefTypeFromNode<T> = ExtractStoreType<T> extends Store<infer S, any> ? S : never

export type ExtractMergedVariables<T> = T extends Node ? Exclude<T['__mergedVariables'], undefined> : undefined

export type Store<T, V extends VariablesNode = {}> = keyof V extends never
	? Ref<T>
	: FunctionN<[ExtractVariables<V>], Ref<T>>

type Values<T> = T[keyof T]

type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

export interface VariablesNode {
	[K: string]: Node
}

export type ExtractVariables<V extends VariablesNode = {}> = {
	[K in keyof V]: ExtractModelType<V[K]>
}

const EMPTY_VARIABLES_MODEL = M.type({})

export function getVariablesModel<V extends VariablesNode>(
	variables: V
): M.Model<{ [K in keyof V]: ExtractModelType<V[K]> }> {
	return isEmptyObject(variables) ? (EMPTY_VARIABLES_MODEL as any) : M.type(variables)
}

const EMPTY_VARIABLES: any = {}

export function number(): NumberNode
export function number<V extends VariablesNode>(variables: V): NumberNode<V>
export function number<V extends VariablesNode = {}>(
	variables: V = EMPTY_VARIABLES,
	store?: Store<number, V>
): NumberNode<V> {
	return {
		tag: 'Number',
		print: constEmptyString,
		variables,
		variablesModel: getVariablesModel(variables),
		model: M.number,
		partialModel: M.number,
		store
	}
}

export const staticNumber = number()

export function isNumberNode(u: Node): u is NumberNode {
	return u.tag === 'Number'
}

export function string(): StringNode
export function string<V extends VariablesNode>(variables: V): StringNode<V>
export function string<V extends VariablesNode = {}>(
	variables: V = EMPTY_VARIABLES,
	store?: Store<string, V>
): StringNode<V> {
	return {
		tag: 'String',
		print: constEmptyString,
		variables,
		variablesModel: getVariablesModel(variables),
		model: M.string,
		partialModel: M.string,
		store
	}
}

export const staticString = string()

export function isStringNode(u: Node): u is StringNode {
	return u.tag === 'String'
}

export function boolean(): BooleanNode
export function boolean<V extends VariablesNode>(variables: V): BooleanNode<V>
export function boolean<V extends VariablesNode = {}>(
	variables: V = EMPTY_VARIABLES,
	store?: Store<boolean, V>
): BooleanNode<V> {
	return {
		tag: 'Boolean',
		print: constEmptyString,
		variables,
		variablesModel: getVariablesModel(variables),
		model: M.boolean,
		partialModel: M.boolean,
		store
	}
}

export const staticBoolean = boolean()

export function isBooleanNode(u: Node): u is BooleanNode {
	return u.tag === 'Boolean'
}

export function isLiteralNode(u: Node): u is LiteralNode {
	return isNumberNode(u) || isStringNode(u) || isBooleanNode(u)
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
	variables: V = EMPTY_VARIABLES,
	store?: Store<{ [K in keyof T]: ExtractStoreType<T[K]> }, V>
): TypeNode<N, T, V> {
	const models = extractTypeMemberModels(members) as any
	return {
		__typename,
		tag: 'Type',
		members,
		variables,
		variablesModel: getVariablesModel(variables),
		store,
		print: printTypeNodeMembers(members),
		model: M.type(models),
		partialModel: M.partial(models)
	}
}

function extractTypeMemberModels<T extends { [K in keyof T]: Node }>(members: T): { [K in keyof T]: T[K]['model'] } {
	const x: any = {}
	Object.keys(members).forEach((key) => {
		x[key as keyof T] = members[key as keyof T].model
	})
	return x
}

const OPEN_BRACKET = '{'

const CLOSE_BRACKET = '}'

const OPEN_PAREN = '('

const CLOSE_PAREN = ')'

const COLON = ':'

const DOLLAR_SIGN = '$'

const EXCLAMATION = '!'

function printTypeNodeMembers(members: { [K: string]: Node }): Lazy<string> {
	return once(() => {
		const tokens: string[] = [OPEN_BRACKET]
		for (const [key, value] of Object.entries(members)) {
			tokens.push(key)
			if (isEmptyObject(value.variables)) {
				tokens.push(COLON, value.print())
			} else {
				tokens.push(printVariablesNode(value.variables), COLON, value.print())
			}
		}
		tokens.push(CLOSE_BRACKET)
		return tokens.join('')
	})
}

function printVariablesNode<V extends VariablesNode>(variables: V): string {
	const tokens: string[] = [OPEN_PAREN]
	const keys = Object.keys(variables)
	const length = keys.length
	const last = length - 1
	let i = 0
	for (; i < length; i++) {
		const key = keys[i]
		tokens.push(DOLLAR_SIGN, key, COLON, printVariableName(variables[key]), i === last ? '' : ', ')
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
		case 'Number':
		case 'String':
			return `${node.tag}${optionalString}`
		case 'Scalar':
			return `${node.name}${optionalString}`
		case 'Type':
			return `${node.__typename}${optionalString}`
		default:
			return ''
	}
}

export function isTypeNode(u: Node): u is TypeNode<string, any, any> {
	return u.tag === 'Type'
}

export function map<K extends Node, T extends Node>(key: K, value: T): MapNode<T, {}, K>
export function map<K extends Node, T extends Node, V extends VariablesNode>(
	key: K,
	value: T,
	variables: V
): MapNode<T, V, K>
export function map<K extends Node, T extends Node, V extends VariablesNode = {}>(
	key: K,
	value: T,
	variables: V = EMPTY_VARIABLES,
	store?: Store<Map<unknown, ExtractStoreType<T>>, V>
): MapNode<T, V, K> {
	return {
		tag: 'Map',
		model: M.map(key.model, value.model),
		partialModel: M.map(key.model, value.partialModel),
		key,
		wrapped: value,
		variables,
		variablesModel: getVariablesModel(variables),
		store,
		print: value.print
	}
}

export function isMapNode(u: Node): u is MapNode<any> {
	return u.tag === 'Map'
}

export function array<T extends Node>(node: T): ArrayNode<T>
export function array<T extends Node, V extends VariablesNode>(node: T, variables: V): ArrayNode<T, V>
export function array<T extends Node, V extends VariablesNode = {}>(
	node: T,
	variables: V = EMPTY_VARIABLES,
	store?: Store<ExtractStoreType<T>[], V>
): ArrayNode<T, V> {
	return {
		tag: 'Array',
		wrapped: node,
		model: M.array(node.model),
		partialModel: M.array(node.partialModel),
		variables,
		variablesModel: getVariablesModel(variables),
		store,
		print: node.print
	}
}

export function isArrayNode(u: Node): u is ArrayNode<any> {
	return u.tag === 'Array'
}

export function sum<T extends { [K in keyof T]: TypeNode<string, any> }>(members: T): SumNode<T>
export function sum<T extends { [K in keyof T]: TypeNode<string, any> }, V extends VariablesNode>(
	members: T,
	variables: V
): SumNode<T, V>
export function sum<T extends { [K in keyof T]: TypeNode<string, any> }, V extends VariablesNode = {}>(
	members: T,
	variables: V = EMPTY_VARIABLES,
	store?: Store<{ [K in keyof T]: ExtractStoreType<T[K]> }[keyof T], V>
): SumNode<T, V> {
	return {
		tag: 'Sum',
		model: getSumModel(members),
		partialModel: getSumPartialModel(members),
		print: printSumNode(members),
		members,
		variablesModel: getVariablesModel(variables),
		variables,
		store
	}
}

export function isSumNode(x: Node): x is SumNode<any, any> {
	return x.tag === 'Sum'
}

function getSumModel<T extends { [K in keyof T]: TypeNode<string, any> }>(
	members: T
): M.Model<{ [K in keyof T]: ExtractModelType<T[K]> }[keyof T]> {
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
): M.Model<{ [K in keyof T]: ExtractPartialModelType<T[K]> }[keyof T]> {
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

const ELLIPSIS = '...'

const OPEN_SPACE = ' '

const TYPENAME = '__typename'

const ON = 'on'

function printSumNode<T extends { [K in keyof T]: TypeNode<string, any> }>(members: T): Lazy<string> {
	return once(() => {
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
	})
}

export function option<T extends Node>(node: T): OptionNode<T>
export function option<T extends Node, V extends VariablesNode>(node: T, variables: V): OptionNode<T, V>
export function option<T extends Node, V extends VariablesNode = {}>(
	node: T,
	variables: V = EMPTY_VARIABLES,
	store?: Store<Option<ExtractStoreType<T>>, V>
): OptionNode<T, V> {
	return {
		tag: 'Option',
		wrapped: node,
		model: M.option(node.model),
		variables,
		variablesModel: getVariablesModel(variables),
		partialModel: M.option(node.partialModel),
		store,
		print: node.print
	}
}

export function isOptionNode(u: Node): u is OptionNode<any> {
	return u.tag === 'Option'
}

export function nonEmptyArray<T extends Node>(node: T): NonEmptyArrayNode<T>
export function nonEmptyArray<T extends Node, V extends VariablesNode>(node: T, variables: V): NonEmptyArrayNode<T, V>
export function nonEmptyArray<T extends Node, V extends VariablesNode = {}>(
	node: T,
	variables: V = EMPTY_VARIABLES,
	store?: Store<NonEmptyArray<ExtractStoreType<T>>, V>
): NonEmptyArrayNode<T, V> {
	return {
		tag: 'NonEmptyArray',
		wrapped: node,
		model: M.nonEmptyArray(node.model),
		partialModel: M.nonEmptyArray(node.partialModel),
		variables,
		variablesModel: getVariablesModel(variables),
		store,
		print: node.print
	}
}

export function isWrappedNode(x: Node): x is WrappedNode<any> {
	const tag = x.tag
	return tag === 'Map' || tag === 'Option' || tag === 'Array' || tag === 'NonEmptyArray'
}

export function scalar<N extends string, T>(name: N, model: M.Model<T>): ScalarNode<N, T>
export function scalar<N extends string, T, V extends VariablesNode>(
	name: N,
	model: M.Model<T>,
	variables: V
): ScalarNode<N, T, V>
export function scalar<N extends string, T, V extends VariablesNode = {}>(
	name: N,
	model: M.Model<T>,
	variables: V = EMPTY_VARIABLES,
	store?: Store<T, V>
): ScalarNode<N, T, V> {
	return {
		name,
		tag: 'Scalar',
		model,
		partialModel: model,
		variables,
		variablesModel: getVariablesModel(variables),
		store,
		print: constEmptyString
	}
}

export function isScalarNode(x: Node): x is ScalarNode<string, any> {
	return x.tag === 'Scalar'
}

export function schema<T extends { [K in keyof T]: Node }>(
	members: T,
	store?: Store<{ [K in keyof T]: ExtractStoreType<T[K]> }, {}>
): Schema<T> {
	const models = extractTypeMemberModels(members) as any
	return {
		tag: 'Schema',
		model: M.type(models),
		partialModel: M.partial(models),
		variables: EMPTY_VARIABLES,
		variablesModel: EMPTY_VARIABLES_MODEL as any,
		print: printTypeNodeMembers(members),
		members,
		store
	}
}

export function isSchemaNode(x: Node): x is Schema<any> {
	return x.tag === 'Schema'
}

export const showNode: Show<Node> = {
	show: (node) => {
		switch (node.tag) {
			case 'Boolean':
			case 'Number':
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
			case 'Schema':
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

export const showTypeNode: Show<TypeNode<string, any, any> | Schema<any>> = {
	show: (node) =>
		`{ ${Object.keys(node.members)
			.map((k) =>
				`${k}: ${node.members[k].tag} ${node.members[k].__typename || node.members[k].name || ''}`.trimEnd()
			)
			.join(', ')} }`
}
