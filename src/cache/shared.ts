import * as N from '../node'

export function isMap(val: unknown): val is Map<any, any> {
	return Object.prototype.toString.call(val) === '[object Map]'
}

export function isArrayNode(node: N.Node): node is N.ArrayNode<any> {
	return node.tag === 'Array'
}

export function isOptionNode(node: N.Node): node is N.OptionNode<any> {
	return node.tag === 'Option'
}

export function isNonEmptyArrayNode(node: N.Node): node is N.NonEmptyArrayNode<any> {
	return node.tag === 'NonEmptyArray'
}

export function isMapNode(node: N.Node): node is N.MapNode<any, any, any, any, any, any> {
	return node.tag === 'Map'
}

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

export function isNonPrimitiveEntityNode(node: N.Node): boolean {
	return !PrimitiveTags.has(node.tag) && !!node?.options?.isEntity
}

export type WrappedNode =
	| N.ArrayNode<any, any, any>
	| N.MapNode<any, any, any, any, any, any, any, any>
	| N.NonEmptyArrayNode<any, any, any>
	| N.OptionNode<any, any, any>

export type CacheGraphqlNode =
	| PrimitiveNode
	| WrappedNode
	| N.TypeNode<any, any, any, any>
	| N.SumNode<any, any, any, any>
	| N.ScalarNode<any, any, any, any, any, any>

const WrappedNodeTags = new Set<N.NodeTag>(['Array', 'Map', 'NonEmptyArray', 'Option'])

export function isWrappedNode(node: N.Node): node is WrappedNode {
	return WrappedNodeTags.has(node.tag)
}

export function traverseMapWithKey<K, A, B>(f: (key: K, value: A) => B) {
	return (map: Map<K, A>): Map<K, B> => {
		const newMap = new Map()
		for (const [key, value] of map.entries()) {
			newMap.set(key, f(key, value))
		}
		return newMap
	}
}

export const traverseMap: <A, B>(f: (value: A) => B) => (map: Map<unknown, A>) => Map<unknown, B> = (f) =>
	traverseMapWithKey((_, a) => f(a))
