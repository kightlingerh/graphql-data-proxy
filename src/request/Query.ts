import { TypeOf } from '../schema/Model'
import { BoxedNode, InterfaceNode, LiteralNode, Node, Schema, VariablesNode } from '../schema/Node'

export type Query<S extends Schema<any> | InterfaceNode<any>> = {
	[K in keyof S['members']]?: ExtractNode<S['members'][K]>
}

type ExtractNode<T> = T extends LiteralNode
	? ExtractLiteralNode<T>
	: T extends BoxedNode<any>
	? ExtractBoxedNode<T>
	: T extends InterfaceNode<any>
	? ExtractInterfaceNode<T>
	: never

type ExtractInterfaceNode<T> = T extends InterfaceNode<any>
	? { [K in keyof T['members']]?: ExtractNode<T['members'][K]> } & ExtractInterfaceNodeVariables<T>
	: never

type ExtractLiteralNode<T> = T extends LiteralNode<infer V>
	? V extends VariablesNode
		? ExtractVariables<V>
		: boolean
	: never

type ExtractBoxedNode<T> = T extends BoxedNode<infer A>
	? A extends InterfaceNode<any>
		? Query<A> & ExtractBoxedNodeLiteralVariables<T>
		: A extends LiteralNode
		? ExtractBoxedNodeLiteralVariables<T>
		: A extends BoxedNode<infer B>
		? B extends InterfaceNode<any>
			? Query<B> & ExtractBoxedNodeLiteralVariables<T>
			: B extends LiteralNode
			? ExtractBoxedNodeLiteralVariables<T>
			: B extends BoxedNode<infer C>
			? C extends InterfaceNode<any>
				? Query<C> & ExtractBoxedNodeLiteralVariables<T>
				: C extends LiteralNode
				? ExtractBoxedNodeLiteralVariables<T>
				: C extends BoxedNode<infer D>
				? D extends InterfaceNode<any>
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
