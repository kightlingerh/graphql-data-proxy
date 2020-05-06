import { FunctionN } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option } from 'fp-ts/lib/Option'
import * as M from '../model/Model'

interface DocumentNode<T, V extends VariablesNode = {}, MV extends VariablesNode = {}> {
	readonly __mergedVariables?: MV
	readonly tag: Tag
	readonly model: M.Model<T>
	readonly gql: string
	readonly variables: V
	readonly store?: Store<T, V>
}

export type Node =
	| LiteralNode<any>
	| TypeNode<string, any, any>
	| WrappedNode<any>
	| SumNode<any, any>
	| ScalarNode<string, any, any>

type Tag =
	| 'Schema'
	| 'String'
	| 'Boolean'
	| 'Number'
	| 'Type'
	| 'Array'
	| 'Map'
	| 'Option'
	| 'NonEmptyArray'
	| 'Sum'
	| 'Scalar'

export interface Schema<T extends { [K in keyof T]: Node }>
	extends DocumentNode<
		{ [K in keyof T]: ExtractModelType<T[K]> },
		{},
		{} & Intersection<Values<{ [K in keyof T]: Exclude<T[K]['__mergedVariables'], undefined> }>>
	> {
	readonly tag: 'Schema'
	readonly members: T
}

export type LiteralNode<V extends VariablesNode = {}> = StringNode<V> | BooleanNode<V> | NumberNode<V>

export interface StringNode<V extends VariablesNode = {}> extends DocumentNode<string, V> {
	readonly tag: 'String'
}

export interface BooleanNode<V extends VariablesNode = {}> extends DocumentNode<boolean, V> {
	readonly tag: 'Boolean'
}

export interface NumberNode<V extends VariablesNode = {}> extends DocumentNode<number, V> {
	readonly tag: 'Number'
}

export interface TypeNode<N extends string, T extends { [K in keyof T]: Node }, V extends VariablesNode = {}>
	extends DocumentNode<
		{ [K in keyof T]: ExtractModelType<T[K]> },
		V,
		V & Intersection<Values<{ [K in keyof T]: Exclude<T[K]['__mergedVariables'], undefined> }>>
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
	extends DocumentNode<ExtractModelType<T>[], V, V & Exclude<T['__mergedVariables'], undefined>> {
	readonly tag: 'Array'
	readonly wrapped: T
}

export interface MapNode<T extends Node, V extends VariablesNode = {}, K extends string | number = string | number>
	extends DocumentNode<Map<K, ExtractModelType<T>>, V, V & Exclude<T['__mergedVariables'], undefined>> {
	readonly tag: 'Map'
	readonly key: K
	readonly wrapped: T
}

export interface OptionNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<Option<ExtractModelType<T>>, V, V & Exclude<T['__mergedVariables'], undefined>> {
	readonly tag: 'Option'
	readonly wrapped: T
}

export interface NonEmptyArrayNode<T extends Node, V extends VariablesNode = {}>
	extends DocumentNode<NonEmptyArray<ExtractModelType<T>>, V, V & Exclude<T['__mergedVariables'], undefined>> {
	readonly tag: 'NonEmptyArray'
	readonly wrapped: T
}

export interface SumNode<T extends { [K in keyof T]: TypeNode<string, any> }, V extends VariablesNode = {}>
	extends DocumentNode<
		{ [K in keyof T]: ExtractModelType<T[K]> }[keyof T],
		V,
		V & Intersection<Values<{ [K in keyof T]: Exclude<T[K]['__mergedVariables'], undefined> }>>
	> {
	readonly tag: 'Sum'
	readonly members: T
}

export interface ScalarNode<N extends string, T, V extends VariablesNode = {}> extends DocumentNode<T, V> {
	readonly tag: 'Scalar'
	readonly name: N
}

type ExtractModelType<T> = T extends { readonly model: M.Model<infer A> } ? A : never

type Store<T, V extends VariablesNode = {}> = keyof V extends never
	? Ref<T>
	: FunctionN<[{ [K in keyof V]: ExtractModelType<V[K]> }], Ref<T>>

type Values<T> = T[keyof T]

type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

interface VariablesNode {
	[K: string]: Node
}

interface Ref<T> {
	value: Option<T>
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

export function mapNode<K extends string | number, T extends Node>(key: M.Model<K>, value: T): MapNode<T, {}, K>
export function mapNode<K extends string | number, T extends Node, V extends VariablesNode>(
	key: M.Model<K>,
	value: T,
	variables: V
): MapNode<T, V, K>
export function mapNode<K extends string | number, T extends Node, V extends VariablesNode | undefined = undefined>(
	key: M.Model<K>,
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
	V extends VariablesNode = {}
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

export function sumNode<T extends { [K in keyof T]: TypeNode<string, any> }>(members: T): SumNode<T>
export function sumNode<T extends { [K in keyof T]: TypeNode<string, any> }, V extends VariablesNode>(
	members: T,
	variables: V
): SumNode<T, V>
export function sumNode<
	T extends { [K in keyof T]: TypeNode<string, any> },
	V extends VariablesNode | undefined = undefined
>(members: T, variables?: V): any {
	return variables === undefined ? { tag: 'Sum', members } : { variables, tag: 'Sum', members }
}

export function scalarNode<N extends string, T>(name: N, model: M.Model<T>): ScalarNode<N, T>
export function scalarNode<N extends string, T, V extends VariablesNode>(
	name: N,
	model: M.Model<T>,
	variables: V
): ScalarNode<N, T, V>
export function scalarNode<N extends string, T, V extends VariablesNode | undefined = undefined>(
	name: N,
	model: M.Model<T>,
	variables?: V
): any {
	return variables === undefined ? { name, tag: 'Scalar', model } : { name, tag: 'Type', variables, model }
}

export function schema<T extends { [K in keyof T]: Node }>(members: T): Schema<T> {
	return {
		tag: 'Schema',
		members
	}
}
