import * as M from '../model/Model'

export type Node<V extends VariablesNode | undefined = undefined> =
	| LiteralNode<V>
	| ScalarNode<string, any, V>
	| TypeNode<string, any, V>
	| ArrayNode<any, V>
	| MapNode<any, V, any>
	| OptionNode<any, V>
	| NonEmptyArrayNode<any, V>
	| SchemaNode<object>
	| SumNode<object, V>

export type SchemaNode<T extends { [K in keyof T]: Node }> = {
	readonly tag: 'Schema'
	readonly members: T
}

export type LiteralNode<V extends VariablesNode | undefined = undefined> =
	| StringNode<V>
	| BooleanNode<V>
	| NumberNode<V>

export type StringNode<V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'String'
	readonly model: M.Model<string>
} & Variables<V>

export type BooleanNode<V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'Boolean'
	readonly model: M.Model<boolean>
	readonly cache?: any
} & Variables<V>

export type NumberNode<V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'Number'
	readonly model: M.Model<number>
} & Variables<V>

export type TypeNode<
	N extends string,
	T extends { [K in keyof T]: Node },
	V extends VariablesNode | undefined = undefined
> = {
	readonly __typename: N
	readonly tag: 'Type'
	readonly members: T
} & Variables<V>

export type BoxedNode<T extends Node, V extends VariablesNode | undefined = undefined> =
	| ArrayNode<T, V>
	| MapNode<T, V>
	| OptionNode<T, V>
	| NonEmptyArrayNode<T, V>

export type ArrayNode<T extends Node, V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'Array'
	readonly boxed: T
} & Variables<V>

type MapKey = M.Model<string> | M.Model<number>

export type MapNode<
	T extends Node,
	V extends VariablesNode | undefined = undefined,
	K extends M.Model<any> = MapKey
> = {
	readonly tag: 'Map'
	readonly key: K
	readonly boxed: T
} & Variables<V>

export type OptionNode<T extends Node, V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'Option'
	readonly boxed: T
} & Variables<V>

export type NonEmptyArrayNode<T extends Node, V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'NonEmptyArray'
	readonly boxed: T
} & Variables<V>

export type SumNode<
	T extends { [K in keyof T]: TypeNode<string, object> },
	V extends VariablesNode | undefined = undefined
> = {
	readonly tag: 'Sum'
	readonly members: T
} & Variables<V>

export type ScalarNode<N extends string, M, V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'Scalar'
	readonly name: N
	readonly model: M.Model<M>
} & Variables<V>

type Variables<V extends VariablesNode | undefined = undefined> = V extends undefined ? {} : { readonly variables: V }

export interface VariablesNode {
	readonly [K: string]: M.Model<any>
}

export function schema<T extends { [K in keyof T]: Node }>(members: T): SchemaNode<T> {
	return {
		tag: 'Schema',
		members
	}
}

export function number(): NumberNode
export function number<V extends VariablesNode>(variables: V): NumberNode<V>
export function number<V extends VariablesNode | undefined = undefined>(variables?: V): any {
	return variables === undefined ? { tag: 'Number', model: M.number } : { tag: 'Number', variables, model: M.number }
}

export const staticNumberNode = number()

export function isNumberNode(u: Node): u is NumberNode {
	return u.tag === 'Number'
}

export function stringNode(): StringNode
export function stringNode<V extends VariablesNode>(variables: V): StringNode<V>
export function stringNode<V extends VariablesNode | undefined = undefined>(variables?: V): any {
	return variables === undefined ? { tag: 'String', model: M.string } : { tag: 'String', variables, model: M.string }
}

export const staticStringNode = stringNode()

export function isStringNode(u: Node): u is StringNode {
	return u.tag === 'String'
}

export function booleanNode(): BooleanNode
export function booleanNode<V extends VariablesNode>(variables: V): BooleanNode<V>
export function booleanNode<V extends VariablesNode | undefined = undefined>(variables?: V): any {
	return variables === undefined
		? { tag: 'Boolean', model: M.boolean }
		: { tag: 'Boolean', variables, model: M.boolean }
}

export const staticBooleanNode = booleanNode()

export function isBooleanNode(u: Node): u is BooleanNode {
	return u.tag === 'Boolean'
}

export function isLiteralNode(u: Node): u is LiteralNode {
	return isNumberNode(u) || isStringNode(u) || isBooleanNode(u)
}

export function mapNode<K extends M.Model<any>, T extends Node>(key: K, value: T): MapNode<T, undefined, K>
export function mapNode<K extends M.Model<any>, T extends Node, V extends VariablesNode>(
	key: K,
	value: T,
	variables: V
): MapNode<T, V, K>
export function mapNode<K extends M.Model<any>, T extends Node, V extends VariablesNode | undefined = undefined>(
	key: K,
	value: T,
	variables?: V
): any {
	return variables === undefined ? { tag: 'Map', key, boxed: value } : { tag: 'Map', key, boxed: value, variables }
}

export function isMapNode(u: Node): u is MapNode<any> {
	return u.tag === 'Map'
}

export function typeNode<N extends string, T extends { [K in keyof T]: Node }>(
	__typename: M.Model<N>,
	members: T
): TypeNode<N, T>
export function typeNode<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesNode>(
	__typename: M.Model<N>,
	members: T,
	variables: V
): TypeNode<N, T, V>
export function typeNode<
	N extends string,
	T extends { [K in keyof T]: Node },
	V extends VariablesNode | undefined = undefined
>(__typename: M.Model<N>, members: T, variables?: V): any {
	return variables === undefined
		? { __typename, tag: 'Type', members }
		: { __typename, tag: 'Type', variables, members }
}

export function isTypeNode(u: Node): u is TypeNode<string, any> {
	return u.tag === 'Type'
}

export function arrayNode<T extends Node>(node: T): ArrayNode<T>
export function arrayNode<T extends Node, V extends VariablesNode>(node: T): ArrayNode<T, V>
export function arrayNode<T extends Node, V extends VariablesNode | undefined = undefined>(
	node: T,
	variables?: V
): any {
	return variables === undefined ? { tag: 'Array', boxed: node } : { tag: 'Array', variables, boxed: node }
}

export function isArrayNode(u: Node): u is ArrayNode<any> {
	return u.tag === 'Array'
}

export function sumNode<T extends { [K in keyof T]: TypeNode<string, object> }>(members: T): SumNode<T>
export function sumNode<T extends { [K in keyof T]: TypeNode<string, object> }, V extends VariablesNode>(
	members: T,
	variables: V
): SumNode<T, V>
export function sumNode<
	T extends { [K in keyof T]: TypeNode<string, object> },
	V extends VariablesNode | undefined = undefined
>(members: T, variables?: V): any {
	return variables === undefined ? { tag: 'Sum', members } : { variables, tag: 'Sum', members }
}
