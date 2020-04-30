import {BoxedNode, InterfaceNode, LiteralNode, Schema} from '../schema/Node'

export type Query<S extends Schema<any> | InterfaceNode<any>> = {
	[K in keyof S['members']]?: S['members'][K] extends LiteralNode ? boolean : ExtractNode<S['members'][K]>
}

type ExtractNode<T> = T extends BoxedNode<infer A>
	? A extends InterfaceNode<any>
		? Query<A>
		: A extends LiteralNode
		? boolean
		: A extends BoxedNode<infer B>
		? B extends InterfaceNode<any>
			? Query<B>
			: B extends LiteralNode
			? boolean
			: B extends BoxedNode<infer C>
			? C extends InterfaceNode<any>
				? Query<C>
				: C extends LiteralNode
				? boolean
				: C extends BoxedNode<infer D>
				? D extends InterfaceNode<any>
					? Query<D>
					: D extends LiteralNode
					? boolean
					: never
				: never
			: never
		: never
	: T extends InterfaceNode<any>
	? Query<T>
	: boolean

type ENode<T> = T extends BoxedNode<infer A> ? ENode<A> : T extends InterfaceNode<any> ? Query<T> : boolean;
