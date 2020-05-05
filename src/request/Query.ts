import { TypeOf } from '../model/Model'
import { BoxedNode, TypeNode, LiteralNode, Node, SchemaNode, VariablesNode } from '../schema/Node'

export type Query<S extends SchemaNode<any> | TypeNode<string, any>> = {
	[K in keyof S['members']]?: ExtractQueryType<S['members'][K]>
}

type ExtractQueryType<T> = T extends LiteralNode
	? ExtractLiteralNode<T>
	: T extends BoxedNode<any>
	? ExtractBoxedNode<T>
	: T extends TypeNode<string, any>
	? ExtractInterfaceNode<T>
	: never

type ExtractInterfaceNode<T> = T extends TypeNode<any, any>
	? { [K in keyof T['members']]?: ExtractQueryType<T['members'][K]> } &
			ExtractInterfaceNodeVariables<T> & { __typename?: boolean }
	: never

type ExtractLiteralNode<T> = T extends LiteralNode<infer V>
	? V extends VariablesNode
		? ExtractVariables<V>
		: boolean
	: never

type ExtractBoxedNode<T> = T extends BoxedNode<infer A>
	? A extends TypeNode<string, any>
		? Query<A> & ExtractBoxedNodeLiteralVariables<T>
		: A extends LiteralNode
		? ExtractBoxedNodeLiteralVariables<T>
		: A extends BoxedNode<infer B>
		? B extends TypeNode<string, any>
			? Query<B> & ExtractBoxedNodeLiteralVariables<T>
			: B extends LiteralNode
			? ExtractBoxedNodeLiteralVariables<T>
			: B extends BoxedNode<infer C>
			? C extends TypeNode<string, any>
				? Query<C> & ExtractBoxedNodeLiteralVariables<T>
				: C extends LiteralNode
				? ExtractBoxedNodeLiteralVariables<T>
				: C extends BoxedNode<infer D>
				? D extends TypeNode<string, any>
					? Query<D> & ExtractBoxedNodeLiteralVariables<T>
					: D extends LiteralNode
					? ExtractBoxedNodeLiteralVariables<T>
					: never
				: never
			: never
		: never
	: never

type ExtractInterfaceNodeVariables<T> = T extends Node<infer V>
	? V extends VariablesNode
		? { readonly __variables: ExtractVariables<V> }
		: {}
	: {}

type ExtractBoxedNodeLiteralVariables<T> = T extends Node<infer V>
	? V extends VariablesNode
		? { readonly __variables: ExtractVariables<V> }
		: boolean
	: never

type ExtractVariables<V> = V extends VariablesNode ? { [K in keyof V]: TypeOf<V[K]> } : never
