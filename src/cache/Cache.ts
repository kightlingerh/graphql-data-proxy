import { FunctionN } from 'fp-ts/lib/function'
import { IO } from 'fp-ts/lib/IO'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option } from 'fp-ts/lib/Option'
import { TypeOf } from '../model'
import {
	ArrayNode,
	BoxedNode,
	LiteralNode,
	MapNode,
	Node,
	NonEmptyArrayNode,
	OptionNode, ScalarNode,
	SchemaNode,
	SumNode,
	TypeNode,
	VariablesNode
} from '../schema/Node'

export type Cache<S extends SchemaNode<any> | TypeNode<string, any>> = {
	[K in keyof S['members']]: ExtractCacheType<S['members'][K]>
}

export type ExtractCacheType<T> = T extends TypeNode<any, any>
	? ExtractTypeNode<T>
	: T extends LiteralNode
	? ExtractLiteralNode<T>
	: T extends BoxedNode<any>
	? ExtractBoxedNode<T>
	: T extends SumNode<any>
	? ExtractSumNode<T>
	: T extends ScalarNode<string, any>
	? ExtractScalarNode<T>
	: never

type ExtractTypeNode<T> = T extends TypeNode<any, any, infer V>
	? V extends VariablesNode
		? FunctionN<[ExtractVariables<V>], { [K in keyof T['members']]: ExtractCacheType<T['members'][K]> }>
		:
				| { [K in keyof T['members']]: ExtractCacheType<T['members'][K]> }
				| IO<{ [K in keyof T['members']]: ExtractCacheType<T['members'][K]> }>
	: never

type ExtractSumNode<T> = T extends SumNode<infer A, infer V>
	? V extends VariablesNode
		? FunctionN<[ExtractVariables<V>], ExtractSumNodeMembers<A>>
		: ExtractSumNodeMembers<A> | IO<ExtractSumNodeMembers<A>>
	: never

type ExtractSumNodeMembers<T> = T extends { [K in keyof T]: TypeNode<string, object> }
	? { [K in keyof T]: { [M in keyof T[K]['members']]: ExtractCacheType<T[K]['members'][M]> } }[keyof T]
	: never

type ExtractLiteralNode<T> = T extends LiteralNode<infer V> ? NodeRef<TypeOf<T['model']>, V> : never

type ExtractScalarNode<T> = T extends ScalarNode<string, infer M, infer V> ? NodeRef<M, V> : never

type ExtractBoxedNode<T> = T extends ArrayNode<any>
	? ExtractArrayNode<T>
	: T extends OptionNode<any>
	? ExtractOptionNode<T>
	: T extends NonEmptyArrayNode<any>
	? ExtractNonEmptyArrayNode<T>
	: T extends MapNode<any, any>
	? ExtractMapNode<T>
	: never

type ExtractArrayNode<T> = T extends Node<infer V>
	? T extends ArrayNode<infer A>
		? A extends LiteralNode
			? NodeRef<TypeOf<A['model']>[], V>
			: A extends TypeNode<string, any>
			? NodeRef<Cache<A>[], V>
			: A extends ArrayNode<infer Arr1>
			? Arr1 extends LiteralNode
				? NodeRef<TypeOf<Arr1['model']>[][], V>
				: Arr1 extends TypeNode<string, any>
				? NodeRef<Cache<Arr1>[][], V>
				: never
			: A extends OptionNode<infer Op1>
			? Op1 extends LiteralNode
				? NodeRef<Option<TypeOf<Op1['model']>[]>, V>
				: Op1 extends TypeNode<string, any>
				? NodeRef<Option<Cache<Op1>>[], V>
				: never
			: A extends MapNode<infer M1, any, infer K1>
			? M1 extends LiteralNode
				? NodeRef<Map<TypeOf<K1>, TypeOf<M1['model']>[]>, V>
				: M1 extends TypeNode<string, any>
				? NodeRef<Map<TypeOf<K1>, Cache<M1>>[], V>
				: never
			: A extends NonEmptyArrayNode<infer NE1>
			? NE1 extends LiteralNode
				? NodeRef<NonEmptyArray<TypeOf<NE1['model']>>[], V>
				: NE1 extends TypeNode<string, any>
				? NodeRef<NonEmptyArray<Cache<NE1>>[], V>
				: never
			: never
		: never
	: never

type ExtractOptionNode<T> = T extends Node<infer V>
	? T extends OptionNode<infer A>
		? A extends LiteralNode
			? NodeRef<Option<TypeOf<A['model']>>, V>
			: A extends TypeNode<string, any>
			? NodeRef<Option<Cache<A>>, V>
			: A extends ArrayNode<infer Arr1>
			? Arr1 extends LiteralNode
				? NodeRef<Option<TypeOf<Arr1['model']>[]>, V>
				: Arr1 extends TypeNode<string, any>
				? NodeRef<Option<Cache<Arr1>[]>, V>
				: never
			: A extends OptionNode<infer Op1>
			? Op1 extends LiteralNode
				? NodeRef<Option<Option<TypeOf<Op1['model']>>>, V>
				: Op1 extends TypeNode<string, any>
				? NodeRef<Option<Option<Cache<Op1>>>, V>
				: never
			: A extends MapNode<infer M1, any, infer K1>
			? M1 extends LiteralNode
				? NodeRef<Option<Map<TypeOf<K1>, TypeOf<M1['model']>>>, V>
				: M1 extends TypeNode<string, any>
				? NodeRef<Option<Map<TypeOf<K1>, Cache<M1>>>, V>
				: never
			: A extends NonEmptyArrayNode<infer NE1>
			? NE1 extends LiteralNode
				? NodeRef<Option<NonEmptyArray<TypeOf<NE1['model']>>>, V>
				: NE1 extends TypeNode<string, any>
				? NodeRef<Option<NonEmptyArray<Cache<NE1>>>, V>
				: never
			: never
		: never
	: never

type ExtractNonEmptyArrayNode<T> = T extends Node<infer V>
	? T extends NonEmptyArrayNode<infer A>
		? A extends LiteralNode
			? NodeRef<NonEmptyArray<TypeOf<A['model']>>, V>
			: A extends TypeNode<string, any>
			? NodeRef<NonEmptyArray<Cache<A>>, V>
			: A extends ArrayNode<infer Arr1>
			? Arr1 extends LiteralNode
				? NodeRef<NonEmptyArray<TypeOf<Arr1['model']>[]>, V>
				: Arr1 extends TypeNode<string, any>
				? NodeRef<NonEmptyArray<Cache<Arr1>[]>, V>
				: never
			: A extends OptionNode<infer Op1>
			? Op1 extends LiteralNode
				? NodeRef<NonEmptyArray<Option<TypeOf<Op1['model']>>>, V>
				: Op1 extends TypeNode<string, any>
				? NodeRef<NonEmptyArray<Option<Cache<Op1>>>, V>
				: never
			: A extends MapNode<infer M1, any, infer K1>
			? M1 extends LiteralNode
				? NodeRef<NonEmptyArray<Map<TypeOf<K1>, TypeOf<M1['model']>>>, V>
				: M1 extends TypeNode<string, any>
				? NodeRef<NonEmptyArray<Map<TypeOf<K1>, Cache<M1>>>, V>
				: never
			: A extends NonEmptyArrayNode<infer NE1>
			? NE1 extends LiteralNode
				? NodeRef<NonEmptyArray<NonEmptyArray<TypeOf<NE1['model']>>>, V>
				: NE1 extends TypeNode<string, any>
				? NodeRef<NonEmptyArray<NonEmptyArray<Cache<NE1>>>, V>
				: never
			: never
		: never
	: never

type ExtractMapNode<T> = T extends Node<infer V>
	? T extends BoxedNode<infer A>
		? T extends MapNode<any, any, infer K>
			? A extends LiteralNode
				? NodeRef<Map<TypeOf<K>, TypeOf<A['model']>>, V>
				: A extends TypeNode<string, any>
				? NodeRef<Map<TypeOf<K>, Cache<A>>, V>
				: A extends ArrayNode<infer Arr1>
				? Arr1 extends LiteralNode
					? NodeRef<Map<TypeOf<K>, TypeOf<Arr1['model']>[]>, V>
					: Arr1 extends TypeNode<string, any>
					? NodeRef<Map<TypeOf<K>, Cache<Arr1>[]>, V>
					: never
				: A extends OptionNode<infer Op1>
				? Op1 extends LiteralNode
					? NodeRef<Map<TypeOf<K>, Option<TypeOf<Op1['model']>>>, V>
					: Op1 extends TypeNode<string, any>
					? NodeRef<Map<TypeOf<K>, Option<Cache<Op1>>>, V>
					: never
				: A extends MapNode<infer M1, any, infer K1>
				? M1 extends LiteralNode
					? NodeRef<Map<TypeOf<K>, Map<TypeOf<K1>, TypeOf<M1['model']>>>, V>
					: M1 extends TypeNode<string, any>
					? NodeRef<Map<TypeOf<K>, Map<TypeOf<K1>, Cache<M1>>>, V>
					: never
				: A extends NonEmptyArrayNode<infer NE1>
				? NE1 extends LiteralNode
					? NodeRef<Map<TypeOf<K>, NonEmptyArray<TypeOf<NE1['model']>>>, V>
					: NE1 extends TypeNode<string, any>
					? NodeRef<Map<TypeOf<K>, NonEmptyArray<Cache<NE1>>>, V>
					: never
				: never
			: never
		: never
	: never

type NodeRef<T, V> = V extends VariablesNode ? VariableRef<V, T> : Ref<T> | IO<Ref<T>>

export interface Ref<T> {
	value: Option<T>
}
type VariableRef<V, T> = V extends undefined ? never : FunctionN<[ExtractVariables<V>], Ref<T>>

type ExtractVariables<V> = V extends VariablesNode ? { [K in keyof V]: TypeOf<V[K]> } : never
