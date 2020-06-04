import { Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option } from 'fp-ts/lib/Option'
import { Show } from 'fp-ts/lib/Show'
import * as M from '../model/Model'

import {
	CLOSE_BRACKET,
	CLOSE_PAREN,
	COLON,
	constEmptyString,
	DOLLAR_SIGN,
	ELLIPSIS,
	isEmptyObject,
	isEmptyString,
	ON,
	once,
	OPEN_BRACKET,
	OPEN_PAREN,
	OPEN_SPACE,
	Ref,
	TYPENAME
} from '../shared'

export interface DocumentNode<M, P, R, V extends VariablesNode = {}, MV extends VariablesNode = {}> {
	readonly tag: string
	readonly variables: DocumentVariables<V, MV>
	readonly model: DocumentModel<M, P, R>
	readonly print: Lazy<string>
}

interface DocumentVariables<V extends VariablesNode = {}, MV extends VariablesNode = {}> {
	children: MV
	definition: V
	model: M.Model<ExtractDefinitionType<V>>
}

interface DocumentModel<W, P, R> {
	whole: M.Model<W>
	partial: M.Model<P>
	__ref?: R
}

export type Node =
	| PrimitiveNode<any>
	| TypeNode<any, any, any>
	| WrappedNode<any>
	| SumNode<any, any>
	| ScalarNode<string, any, any>
	| MutationNode<any, any>

export type PrimitiveNode<V extends VariablesNode = {}> = StringNode<V> | BooleanNode<V> | NumberNode<V>

export interface StringNode<V extends VariablesNode = {}> extends DocumentNode<string, string, Ref<string>, V> {
	readonly tag: 'String'
}

export interface BooleanNode<V extends VariablesNode = {}> extends DocumentNode<boolean, boolean, Ref<boolean>, V> {
	readonly tag: 'Boolean'
}

export type NumberPrecision = 'Float' | 'Int'

export interface NumberNode<V extends VariablesNode = {}> extends DocumentNode<number, number, Ref<number>, V> {
	readonly tag: 'Number'
	readonly precision: NumberPrecision
}

export interface TypeNode<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesNode = {}>
	extends DocumentNode<
		{ [K in keyof T]: ExtractModelType<T[K]> },
		Partial<{ [K in keyof T]: ExtractModelType<T[K]> }>,
		Ref<{ [K in keyof T]: ExtractRefType<T[K]> }>,
		V,
		{} & Intersection<
			Values<{ [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]> }>
		>
	> {
	readonly __typename: N
	readonly tag: 'Type'
	readonly members: T
}

export interface SchemaNode<N extends string, T extends { [K in keyof T]: Node }> extends TypeNode<N, T> {}

export type WrappedNode<T extends Node> =
	| ArrayNode<T, any>
	| MapNode<T, any, any>
	| OptionNode<T, any>
	| NonEmptyArrayNode<T, any>

export interface ArrayNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		ExtractModelType<T>[],
		ExtractPartialModelType<T>[],
		Ref<ExtractRefType<T>[]>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Array'
	readonly wrapped: T
}

export interface NonEmptyArrayNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		NonEmptyArray<ExtractModelType<T>>,
		NonEmptyArray<ExtractPartialModelType<T>>,
		Ref<NonEmptyArray<ExtractRefType<T>>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'NonEmptyArray'
	readonly wrapped: T
}

export interface MapNode<K extends Node, T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		Map<ExtractModelType<K>, ExtractModelType<T>>,
		Map<ExtractModelType<K>, ExtractPartialModelType<T>>,
		Ref<Map<unknown, ExtractRefType<T>>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Map'
	readonly key: K
	readonly wrapped: T
}

export interface OptionNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		Option<ExtractModelType<T>>,
		Option<ExtractPartialModelType<T>>,
		Ref<Option<ExtractRefType<T>>>,
		V,
		{} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>
	> {
	readonly tag: 'Option'
	readonly wrapped: T
}

export interface SumNode<T extends { [K in keyof T]: TypeNode<any, any, any> }, V extends VariablesNode = {}>
	extends DocumentNode<
		{ [K in keyof T]: ExtractModelType<T[K]> }[keyof T],
		{ [K in keyof T]: ExtractPartialModelType<T[K]> }[keyof T],
		Ref<{ [K in keyof T]: ExtractRefType<T[K]> }[keyof T]>,
		V,
		{} & Intersection<
			Values<{ [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]> }>
		>
	> {
	readonly tag: 'Sum'
	readonly members: T
}

export interface MutationNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<
		ExtractModelType<T>,
		ExtractPartialModelType<T>,
		ExtractRefType<T>,
		V,
		{} & ExtractChildrenVariablesDefinition<T>
	> {
	readonly tag: 'Mutation'
	readonly result: T
}

export interface ScalarNode<N extends string, T, V extends VariablesNode = {}> extends DocumentNode<T, T, Ref<T>, V> {
	readonly tag: 'Scalar'
	readonly name: N
}

export type ExtractRefType<T> = T extends { readonly model: DocumentModel<any, any, infer A> } ? A : never

export type ExtractModelType<T> = T extends { readonly model: DocumentModel<infer A, any, any> } ? A : never

export type ExtractPartialModelType<T> = T extends { readonly model: DocumentModel<any, infer A, any> } ? A : never

export type ExtractChildrenVariablesType<T> = T extends { readonly variables: DocumentVariables<any, infer A> }
	? ExtractDefinitionType<A>
	: never

export type ExtractChildrenVariablesDefinition<T> = T extends { readonly variables: DocumentVariables<any, infer A> }
	? A
	: never

export type Values<T> = T[keyof T]

export type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

export interface VariablesNode {
	[K: string]: Node
}

export type ExtractVariablesType<T> = T extends { readonly variables: DocumentVariables<infer A, any> }
	? ExtractDefinitionType<A>
	: never

export type ExtractVariablesDefinition<T> = T extends { readonly variables: DocumentVariables<infer A, any> }
	? A
	: never

export type ExtractDefinitionType<V> = {
	[K in keyof V]: ExtractModelType<V[K]>
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

export const EMPTY_VARIABLES_MODEL = M.type({})

export function getVariablesModel<V extends VariablesNode>(
	variables: V
): M.Model<{ [K in keyof V]: ExtractModelType<V[K]> }> {
	return isEmptyObject(variables) ? (EMPTY_VARIABLES_MODEL as any) : M.type(variables)
}

export const EMPTY_VARIABLES: any = {}

export function number(): NumberNode
export function number<V extends VariablesNode>(variables: V): NumberNode<V>
export function number<V extends VariablesNode>(variables: V, precision?: NumberPrecision): NumberNode<V>
export function number<V extends VariablesNode = {}>(variables: V = EMPTY_VARIABLES, precision: NumberPrecision = 'Float'): NumberNode<V> {
	return {
		tag: 'Number',
		precision,
		print: constEmptyString,
		variables: {
			children: EMPTY_VARIABLES,
			definition: variables,
			model: getVariablesModel(variables)
		},
		model: {
			whole: M.number,
			partial: M.number
		}
	}
}

export const staticNumber = number()

export function isNumberNode(u: Node): u is NumberNode {
	return u.tag === 'Number'
}

export function string(): StringNode
export function string<V extends VariablesNode>(variables: V): StringNode<V>
export function string<V extends VariablesNode = {}>(variables: V = EMPTY_VARIABLES): StringNode<V> {
	return {
		tag: 'String',
		print: constEmptyString,
		variables: {
			children: EMPTY_VARIABLES,
			model: getVariablesModel(variables),
			definition: variables
		},
		model: {
			whole: M.string,
			partial: M.string
		}
	}
}

export const staticString = string()

export function isStringNode(u: Node): u is StringNode {
	return u.tag === 'String'
}

export function boolean(): BooleanNode
export function boolean<V extends VariablesNode>(variables: V): BooleanNode<V>
export function boolean<V extends VariablesNode = {}>(variables: V = EMPTY_VARIABLES): BooleanNode<V> {
	return {
		tag: 'Boolean',
		print: constEmptyString,
		variables: {
			children: EMPTY_VARIABLES,
			model: getVariablesModel(variables),
			definition: variables
		},
		model: {
			whole: M.boolean,
			partial: M.boolean
		}
	}
}

export const staticBoolean = boolean()

export function isBooleanNode(u: Node): u is BooleanNode {
	return u.tag === 'Boolean'
}

export function isPrimitiveNode(u: Node): u is PrimitiveNode {
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
	variables: V = EMPTY_VARIABLES
): TypeNode<N, T, V> {
	const models = extractTypeMemberModels(members) as any
	return {
		__typename,
		tag: 'Type',
		members,
		variables: {
			children: extractTypeChildrenVariables(members),
			model: getVariablesModel(variables),
			definition: variables
		},
		print: printTypeNodeMembers(members),
		model: {
			whole: M.type(models),
			partial: M.partial(models)
		}
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

function printTypeNodeMembers(members: { [K: string]: Node }): Lazy<string> {
	return once(() => {
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
	})
}

export function printVariablesNode<V extends VariablesNode>(variables: V): string {
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

export function isTypeNode(u: Node): u is TypeNode<any, any, any> {
	return u.tag === 'Type'
}

export function schema<N extends string, T extends { [K in keyof T]: Node }>(
	__typename: N,
	members: T
): SchemaNode<N, T> {
	const models = extractTypeMemberModels(members) as any
	return {
		__typename,
		tag: 'Type',
		members,
		variables: {
			children: extractTypeChildrenVariables(members),
			model: EMPTY_VARIABLES_MODEL as any,
			definition: EMPTY_VARIABLES
		},
		print: () => printTypeNodeMembers(members)().trim(),
		model: {
			whole: M.type(models),
			partial: M.partial(models)
		}
	}
}

export function isSchemaNode(u: Node): u is SchemaNode<any, any> {
	return isTypeNode(u) && isEmptyObject(u.variables.definition)
}

export function map<K extends Node, T extends Node>(key: K, value: T): MapNode<K, T, {}>
export function map<K extends Node, T extends Node, V extends VariablesNode>(
	key: K,
	value: T,
	variables: V
): MapNode<K, T, V>
export function map<K extends Node, T extends Node, V extends VariablesNode = {}>(
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

export function isMapNode(u: Node): u is MapNode<any, any> {
	return u.tag === 'Map'
}

export function array<T extends Node>(node: T): ArrayNode<T>
export function array<T extends Node, V extends VariablesNode>(node: T, variables: V): ArrayNode<T, V>
export function array<T extends Node, V extends VariablesNode = {}>(
	node: T,
	variables: V = EMPTY_VARIABLES
): ArrayNode<T, V> {
	return {
		tag: 'Array',
		wrapped: node,
		model: {
			whole: M.array(node.model.whole),
			partial: M.array(node.model.partial)
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(node),
			definition: variables,
			model: getVariablesModel(variables)
		},

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
	variables: V = EMPTY_VARIABLES
): OptionNode<T, V> {
	return {
		tag: 'Option',
		wrapped: node,
		model: {
			whole: M.option(node.model.whole),
			partial: M.option(node.model.partial)
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(node),
			model: getVariablesModel(variables),
			definition: variables
		},
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
	variables: V = EMPTY_VARIABLES
): NonEmptyArrayNode<T, V> {
	return {
		tag: 'NonEmptyArray',
		wrapped: node,
		model: {
			whole: M.nonEmptyArray(node.model.whole),
			partial: M.nonEmptyArray(node.model.partial)
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(node),
			definition: variables,
			model: getVariablesModel(variables)
		},
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
	variables: V = EMPTY_VARIABLES
): ScalarNode<N, T, V> {
	return {
		name,
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
		print: constEmptyString
	}
}

export function isScalarNode(x: Node): x is ScalarNode<string, any> {
	return x.tag === 'Scalar'
}

export function mutation<T extends Node>(node: T): MutationNode<T>
export function mutation<T extends Node, V extends VariablesNode>(node: T, variables: V): MutationNode<T, V>
export function mutation<T extends Node, V extends VariablesNode = {}>(
	node: T,
	variables: V = EMPTY_VARIABLES
): MutationNode<T, V> {
	return {
		tag: 'Mutation',
		result: node,
		model: {
			whole: node.model.whole as ExtractModelType<T>,
			partial: node.model.partial as ExtractPartialModelType<T>
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(node),
			model: getVariablesModel(variables),
			definition: variables
		},
		print: node.print
	}
}

export function isMutationNode(u: Node): u is MutationNode<any, any> {
	return u.tag === 'Mutation'
}
