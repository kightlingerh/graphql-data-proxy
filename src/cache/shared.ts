import * as N from '../node'

export function isTypeNode(node: N.Node): node is N.TypeNode<any, any, any, any> {
	return node.tag === 'Type'
}

export function isScalarNode(node: N.Node): node is N.ScalarNode<any, any, any, any, any, any> {
	return node.tag === 'Scalar'
}

export function isSumNode(node: N.Node): node is N.SumNode<any, any, any> {
	return node.tag === 'Sum'
}

export type PrimitiveNode =
	| N.BooleanNode<any, any>
	| N.FloatNode<any, any>
	| N.IntNode<any, any>
	| N.StringNode<any, any>
	| N.ScalarNode<any, any, any, any, any, any>

const PrimitiveTags = new Set<N.NodeTag>(['Boolean', 'Float', 'Int', 'String', 'Scalar'])

export function isPrimitiveNode(node: N.Node): node is PrimitiveNode {
	return PrimitiveTags.has(node.tag)
}

export type WrappedNode =
	| N.ArrayNode<any, any, any>
	| N.NonEmptyArrayNode<any, any, any>
	| N.OptionNode<any, any, any>

const WrappedNodeTags = new Set<N.NodeTag>(['Array', 'NonEmptyArray', 'Option'])

export function isWrappedNode(node: N.Node): node is WrappedNode {
	return WrappedNodeTags.has(node.tag)
}
