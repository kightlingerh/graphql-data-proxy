import {NonEmptyArray} from 'fp-ts/lib/NonEmptyArray';
import {Option} from 'fp-ts/lib/Option';
import {TypeOf} from '../model/Model';
import * as M from '../model/Model'

export type Node<V extends VariablesNode | undefined = undefined> =
	| LiteralNode<V>
	| ScalarNode<string, any, V>
	| TypeNode<string, any, V>
	| ArrayNode<any, V>
	| MapNode<any, V, any>
	| OptionNode<any, V>
	| NonEmptyArrayNode<any, V>
	| SumNode<object, V>
	| SchemaNode<object>;

export type SchemaNode<T extends { [K in keyof T]: Node }> = {
	readonly __responseType?: { [K in keyof T]: ExtractResponseType<T[K]> }
	readonly __requestType?: { [K in keyof T]: ExtractRequestType<T[K]> }
	readonly __cacheType?: { [K in keyof T]: ExtractCacheType<T[K]> }
	readonly tag: 'Schema'
	readonly members: T
}

export type LiteralNode<V extends VariablesNode | undefined = undefined> =
	| StringNode<V>
	| BooleanNode<V>
	| NumberNode<V>

export type StringNode<V extends VariablesNode | undefined = undefined> = {
	readonly __responseType?: string;
	readonly __requestType?: boolean;
	readonly __cacheType?: Ref<string>;
	readonly tag: 'String'
	readonly model: M.Model<string>
} & Variables<V>

export type BooleanNode<V extends VariablesNode | undefined = undefined> = {
	readonly __responseType?: boolean;
	readonly __requestType?: boolean;
	readonly __cacheType?: Ref<boolean>;
	readonly tag: 'Boolean'
	readonly model: M.Model<boolean>
} & Variables<V>

export type NumberNode<V extends VariablesNode | undefined = undefined> = {
	readonly __responseType?: number;
	readonly __requestType?: boolean;
	readonly __cacheType?: Ref<number>;
	readonly tag: 'Number'
	readonly model: M.Model<number>
} & Variables<V>

export type TypeNode<
	N extends string,
	T extends { [K in keyof T]: Node },
	V extends VariablesNode | undefined = undefined
> = {
	readonly __responseType?: { [K in keyof T]: ExtractResponseType<T[K]> }
	readonly __requestType?: { [K in keyof T]: ExtractRequestType<T[K]> };
	readonly __cacheType?: { [K in keyof T]: ExtractCacheType<T[K]> }
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
	readonly __responseType?: ExtractResponseType<T>[];
	readonly __requestType?: ExtractRequestType<T>;
	readonly __cacheType?: Ref<ExtractCacheType<T>[]>;
	readonly tag: 'Array'
	readonly boxed: T
} & Variables<V>

type MapKey = M.Model<string> | M.Model<number>

export type MapNode<
	T extends Node,
	V extends VariablesNode | undefined = undefined,
	K extends M.Model<any> = MapKey
> = {
	readonly __responseType?: Map<TypeOf<K>, ExtractResponseType<T>>;
	readonly __requestType?: ExtractRequestType<T>;
	readonly __cacheType?: Ref<Map<TypeOf<K>, ExtractCacheType<T>>>
	readonly tag: 'Map'
	readonly key: K
	readonly boxed: T
} & Variables<V>

export type OptionNode<T extends Node, V extends VariablesNode | undefined = undefined> = {
	readonly __responseType?: Option<ExtractResponseType<T>>;
	readonly __requestType?: ExtractRequestType<T>;
	readonly __cacheType?: Ref<Option<ExtractCacheType<T>>>
	readonly tag: 'Option'
	readonly boxed: T
} & Variables<V>

export type NonEmptyArrayNode<T extends Node, V extends VariablesNode | undefined = undefined> = {
	readonly __responseType?: NonEmptyArray<ExtractResponseType<T>>;
	readonly __requestType?: ExtractRequestType<T>;
	readonly __cacheType?: Ref<NonEmptyArray<ExtractCacheType<T>>>
	readonly tag: 'NonEmptyArray'
	readonly boxed: T
} & Variables<V>

export type SumNode<
	T extends { [K in keyof T]: TypeNode<string, object> },
	V extends VariablesNode | undefined = undefined
> = {
	readonly __responseType?: { [K in keyof T]: ExtractResponseType<T[K]> }[keyof T];
	readonly __requestType?: { [K in keyof T]: ExtractRequestType<T[K]> }[keyof T];
	readonly __cacheType?: { [K in keyof T]: ExtractCacheType<T[K]> }[keyof T];
	readonly tag: any // typescript is bugging out here, should be 'Sum'
	readonly members: T
} & Variables<V>

export type ScalarNode<N extends string, T, V extends VariablesNode | undefined = undefined> = {
	readonly __responseType?: T;
	readonly __requestType?: boolean;
	readonly __cacheType?: Ref<T>
	readonly tag: 'Scalar'
	readonly name: N
	readonly model: M.Model<T>
} & Variables<V>

export type ExtractResponseType<T> = T extends Node ? Exclude<T['__responseType'], undefined> : never;

export type ExtractCacheType<T> = T extends Node ? Exclude<T['__cacheType'], undefined> : never

export type ExtractRequestType<T> = T extends Node ? Exclude<T['__requestType'], undefined>: never;

type Variables<V extends VariablesNode | undefined = undefined> = V extends undefined ? {} : { readonly variables: V }

export interface VariablesNode {
	readonly [K: string]: M.Model<any>
}

interface Ref<T> {
	value: Option<T>;
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

export function scalarNode<N extends string, T>(
	name: N,
	model: M.Model<T>
): ScalarNode<N, T>
export function scalarNode<N extends string, T, V extends VariablesNode>(
	name: N,
	model: M.Model<T>,
	variables: V
): ScalarNode<N, T, V>
export function scalarNode<
	N extends string,
	T,
	V extends VariablesNode | undefined = undefined
	>(name: N, model: M.Model<T>, variables?: V): any {
	return variables === undefined
		? { name, tag: 'Scalar', model }
		: { name, tag: 'Type', variables, model }
}
