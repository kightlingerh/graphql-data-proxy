import { Eq } from 'fp-ts/lib/Eq'
import { Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { Show } from 'fp-ts/lib/Show'
import { Encoder } from 'io-ts/lib/Encoder'
import * as M from '../model/Model'
import {
	CacheResult,
	CacheWriteResult,
	CLOSE_BRACKET,
	CLOSE_PAREN,
	COLON,
	constEmptyString,
	DOLLAR_SIGN,
	ELLIPSIS,
	EXCLAMATION,
	isEmptyObject,
	isEmptyString,
	ON,
	OPEN_BRACKET,
	OPEN_PAREN,
	OPEN_SPACE,
	Ref,
	TYPENAME
} from '../shared'

export type TypeOf<T> = T extends { readonly model: NodeModel<infer A, any, any> } ? A : never

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
	extends NodeBase<string, string, Ref<O.Option<string>>, V> {
	readonly tag: 'String'
}

export interface BooleanNode<V extends VariablesDefinition = {}>
	extends NodeBase<boolean, boolean, Ref<O.Option<boolean>>, V> {
	readonly tag: 'Boolean'
}

export interface IntNode<V extends VariablesDefinition = {}>
	extends NodeBase<number, number, Ref<O.Option<number>>, V> {
	readonly tag: 'Int'
}

export interface FloatNode<V extends VariablesDefinition = {}>
	extends NodeBase<number, number, Ref<O.Option<number>>, V> {
	readonly tag: 'Float'
}

export interface TypeNode<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesDefinition = {}>
	extends NodeBase<
		{ [K in keyof T]: TypeOf<T[K]> },
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
	extends NodeBase<
		TypeOf<T>[],
		ExtractPartialModelType<T>[],
		Ref<TypeOfRefs<T>[]>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Array'
	readonly wrapped: T
}

export interface MapNode<K extends Node, T extends Node, V extends VariablesDefinition = {}>
	extends NodeBase<
		Map<TypeOf<K>, TypeOf<T>>,
		Map<TypeOf<K>, ExtractPartialModelType<T>>,
		Map<unknown, TypeOfRefs<T>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Map'
	readonly key: K
	readonly wrapped: T
}

export interface OptionNode<T extends Node, V extends VariablesDefinition = {}>
	extends NodeBase<
		O.Option<TypeOf<T>>,
		O.Option<ExtractPartialModelType<T>>,
		Ref<O.Option<TypeOfRefs<T>>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Option'
	readonly wrapped: T
}

export interface NonEmptyArrayNode<T extends Node, V extends VariablesDefinition = {}>
	extends NodeBase<
		NonEmptyArray<TypeOf<T>>,
		NonEmptyArray<ExtractPartialModelType<T>>,
		Ref<O.Option<NonEmptyArray<TypeOfRefs<T>>>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'NonEmptyArray'
	readonly wrapped: T
}

export interface SumNode<T extends { [K in keyof T]: TypeNode<any, any, any> }, V extends VariablesDefinition = {}>
	extends NodeBase<
		{ [K in keyof T]: TypeOf<T[K]> & { __typename: T[K]['__typename'] } }[keyof T],
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
	extends NodeBase<
		TypeOf<T>,
		ExtractPartialModelType<T>,
		TypeOfRefs<T>,
		V,
		{} & ExtractChildrenVariablesDefinition<T>
	> {
	readonly tag: 'Mutation'
	readonly result: T
}

export interface ScalarNode<N extends string, T, V extends VariablesDefinition = {}>
	extends NodeBase<T, T, Ref<O.Option<T>>, V> {
	readonly tag: 'Scalar'
	readonly name: N
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
	readonly tag: string
	readonly print: Lazy<string>
	readonly __cache__?: BaseCacheConfig;
}

export interface BaseCacheConfig {
	isEntity: boolean;
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

export type ExtractPartialModelType<T> = T extends { readonly model: NodeModel<any, infer A, any> } ? A : never

export type ExtractChildrenVariablesDefinition<T> = T extends { readonly variables: NodeVariables<any, infer A> }
	? A
	: never

type Values<T> = T[keyof T]

type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

export type ExtractVariablesDefinition<T> = T extends { readonly variables: NodeVariables<infer A, any> } ? A : never

export type ExtractDefinitionType<V> = {
	[K in keyof V]: TypeOf<V[K]>
}


const EMPTY_VARIABLES_MODEL = M.type({})

const EMPTY_VARIABLES: any = {}

function getVariablesModel<V extends VariablesDefinition>(
	variables: V
): M.Model<{ [K in keyof V]: TypeOf<V[K]> }> {
	return isEmptyObject(variables) ? (EMPTY_VARIABLES_MODEL as any) : M.type(variables)
}

export function int(): IntNode
export function int<V extends VariablesDefinition>(variables: V): IntNode<V>
export function int<V extends VariablesDefinition = {}>(variables: V = EMPTY_VARIABLES): IntNode<V> {
	return {
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
		print: constEmptyString
	}
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
	return {
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
		print: constEmptyString
	};
}

export const staticString = string()

export function isStringNode(u: Node): u is StringNode {
	return u.tag === 'String'
}

export function boolean(): BooleanNode
export function boolean<V extends VariablesDefinition>(variables: V): BooleanNode<V>
export function boolean<V extends VariablesDefinition = {}>(variables: V = EMPTY_VARIABLES): BooleanNode<V> {
	return {
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
	}
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
	return {
		tag: 'Scalar',
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
		print: constEmptyString
	}
}

export function isScalarNode(x: Node): x is ScalarNode<string, any> {
	return x.tag === 'Scalar'
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
	return {
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
		print: printTypeNodeMembers(members)
	}
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
	return {
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
		print: value.print
	}
}

export function isMapNode(u: Node): u is MapNode<any, any> {
	return u.tag === 'Map'
}

export function array<T extends Node>(wrapped: T): ArrayNode<T>
export function array<T extends Node, V extends VariablesDefinition>(wrapped: T, variables: V): ArrayNode<T, V>
export function array<T extends Node, V extends VariablesDefinition = {}>(
	wrapped: T,
	variables: V = EMPTY_VARIABLES
): ArrayNode<T, V> {
	return {
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

		print: wrapped.print
	}
}

export function isArrayNode(u: Node): u is ArrayNode<any> {
	return u.tag === 'Array'
}

function getSumModel<T extends { [K in keyof T]: TypeNode<string, any> }>(
	members: T
): M.Model<{ [K in keyof T]: TypeOf<T[K]> & { __typename: T[K]['__typename'] } }[keyof T]> {
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
	return {
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
		}
	}
}

export function isSumNode(x: Node): x is SumNode<any, any> {
	return x.tag === 'Sum'
}

export function option<T extends Node>(wrapped: T): OptionNode<T>
export function option<T extends Node, V extends VariablesDefinition>(wrapped: T, variables: V): OptionNode<T, V>
export function option<T extends Node, V extends VariablesDefinition = {}>(
	wrapped: T,
	variables: V = EMPTY_VARIABLES
): OptionNode<T, V> {
	return {
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
		print: wrapped.print
	}
}

export function isOptionNode(u: Node): u is OptionNode<any> {
	return u.tag === 'Option'
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
	return {
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
		print: wrapped.print
	}
}

export function isNonEmptyArrayNode(u: Node): u is NonEmptyArrayNode<any, any> {
	return u.tag === 'NonEmptyArray'
}

export function isWrappedNode(x: Node): x is WrappedNode {
	const tag = x.tag
	return tag === 'Map' || tag === 'Option' || tag === 'Array' || tag === 'NonEmptyArray'
}

export function mutation<T extends Node>(result: T): MutationNode<T>
export function mutation<T extends Node, V extends VariablesDefinition>(result: T, variables: V): MutationNode<T, V>
export function mutation<T extends Node, V extends VariablesDefinition = {}>(
	result: T,
	variables: V = EMPTY_VARIABLES
): MutationNode<T, V> {
	return {
		tag: 'Mutation',
		result: result,
		model: {
			whole: result.model.whole as TypeOf<T>,
			partial: result.model.partial as ExtractPartialModelType<T>
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(result),
			model: getVariablesModel(variables),
			definition: variables
		},
		print: result.print
	}
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

export function useEq<T extends NodeBase<any, any, any, any, any>>(node: T, eq: Eq<TypeOf<T>>): T {
	return {
		...node,
		model: {
			...node.model,
			whole: M.useEq(node.model.whole, eq)
		}
	}
}

export function eqById<
	N extends string,
	T extends { [K in keyof T]: Node } & Record<'id', Node>,
	V extends VariablesDefinition = {}
>(node: TypeNode<N, T, V>): TypeNode<N, T, V> {
	return {
		...node,
		model: {
			...node.model,
			whole: M.eqById(node.model.whole)
		}
	}
}

export function useEncoder<T extends NodeBase<any, any, any, any, any>>(
	node: T,
	encoder: Encoder<TypeOf<T>>
): T {
	return {
		...node,
		model: {
			...node.model,
			whole: M.useEncoder(node.model.whole, encoder)
		}
	}
}

export function encodeById<
	N extends string,
	T extends { [K in keyof T]: Node } & Record<'id', Node>,
	V extends VariablesDefinition = {}
>(node: TypeNode<N, T, V>): TypeNode<N, T, V> {
	return {
		...node,
		model: {
			...node.model,
			whole: M.useEncoder(node.model.whole, {
				encode: a => node.members.id.model.whole.encode(a.id)
			})
		}
	}
}

export function markAsEntity<T extends NodeBase<any, any, any, any, any>>(
	node: T
): Omit<T, 'model'> & {
	readonly model: NodeModel<TypeOf<T>, ExtractPartialModelType<T>, Ref<TypeOf<T>>>
} {
	return {
		...node,
		__cache__: {
			...node.__cache__,
			isEntity: true
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
