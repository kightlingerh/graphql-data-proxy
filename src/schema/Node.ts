import * as m from '../model/Model'
import { Model } from '../model/Model'

export type Node<V extends VariablesNode | undefined = undefined> =
	| LiteralNode<V>
	| TypeNode<string, any, V>
	| ArrayNode<any, V>
	| MapNode<any, V, any>
	| OptionNode<any, V>
	| NonEmptyArrayNode<any, V>
	| SchemaNode<object>

export type SchemaNode<T extends { [K in keyof T]: Node }> = {
	readonly members: T
	readonly tag: 'Schema'
}

export type LiteralNode<V extends VariablesNode | undefined = undefined> =
	| StringNode<V>
	| BooleanNode<V>
	| NumberNode<V>

export type StringNode<V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'String'
	readonly model: Model<string>
} & Variables<V>

export type BooleanNode<V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'Boolean'
	readonly model: Model<boolean>
} & Variables<V>

export type NumberNode<V extends VariablesNode | undefined = undefined> = {
	readonly tag: 'Number'
	readonly model: Model<number>
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

type MapKey = Model<string> | Model<number>

export type MapNode<T extends Node, V extends VariablesNode | undefined = undefined, K extends Model<any> = MapKey> = {
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

type Variables<V extends VariablesNode | undefined = undefined> = V extends undefined ? {} : { readonly variables: V }

export interface VariablesNode {
	readonly [K: string]: Model<any>
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
	return variables === undefined ? { tag: 'Number', model: m.number } : { tag: 'Number', variables, model: m.number }
}

export const staticNumberNode = number()

export function isNumberNode(u: Node): u is NumberNode {
	return u.tag === 'Number'
}

export function stringNode(): StringNode
export function stringNode<V extends VariablesNode>(variables: V): StringNode<V>
export function stringNode<V extends VariablesNode | undefined = undefined>(variables?: V): any {
	return variables === undefined ? { tag: 'String', model: m.string } : { tag: 'String', variables, model: m.string }
}

export const staticStringNode = stringNode()

export function isStringNode(u: Node): u is StringNode {
	return u.tag === 'String'
}

export function booleanNode(): BooleanNode
export function booleanNode<V extends VariablesNode>(variables: V): BooleanNode<V>
export function booleanNode<V extends VariablesNode | undefined = undefined>(variables?: V): any {
	return variables === undefined
		? { tag: 'Boolean', model: m.boolean }
		: { tag: 'Boolean', variables, model: m.boolean }
}

export const staticBooleanNode = booleanNode()

export function isBooleanNode(u: Node): u is BooleanNode {
	return u.tag === 'Boolean'
}

export function isLiteralNode(u: Node): u is LiteralNode {
	return isNumberNode(u) || isStringNode(u) || isBooleanNode(u)
}

export function mapNode<K extends Model<any>, T extends Node>(key: K, value: T): MapNode<T, undefined, K>
export function mapNode<K extends Model<any>, T extends Node, V extends VariablesNode>(
	key: K,
	value: T,
	variables: V
): MapNode<T, V, K>
export function mapNode<K extends Model<any>, T extends Node, V extends VariablesNode | undefined = undefined>(
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
	__typename: Model<N>,
	members: T
): TypeNode<N, T>
export function typeNode<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesNode>(
	__typename: Model<N>,
	members: T,
	variables: V
): TypeNode<N, T, V>
export function typeNode<
	N extends string,
	T extends { [K in keyof T]: Node },
	V extends VariablesNode | undefined = undefined
>(__typename: Model<N>, members: T, variables?: V): any {
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
