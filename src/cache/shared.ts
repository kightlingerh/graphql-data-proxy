import * as N from '../node/index'

export function isArrayNode(node: N.Node): node is N.ArrayNode<any> {
	return node.tag === 'Array'
}

export function isOptionNode(node: N.Node): node is N.OptionNode<any> {
	return node.tag === 'Option'
}

export function isNoneEmptyArrayNode(node: N.Node): node is N.NonEmptyArrayNode<any> {
	return node.tag === 'NonEmptyArray'
}

export function isMapNode(node: N.Node): node is N.MapNode<any, any, any, any, any, any> {
	return node.tag === 'Map'
}

export function isWrappedNode(node: N.Node): node is N.WrappedNode {
	switch (node.tag) {
		case 'Option':
		case 'NonEmptyArray':
		case 'Map':
		case 'Array':
			return true
		default:
			return false
	}
}

export function isEntityNode(node: N.Node): boolean {
	switch (node.tag) {
		case 'Int':
		case 'Boolean':
		case 'String':
		case 'Scalar':
		case 'Float':
			return true
		default:
			return !!node?.__cache__?.isEntity
	}
}

export function isTypeNode(node: N.Node): node is N.TypeNode<any, any, any, any, any, any, any> {
	return node.tag === 'Type'
}

export function isScalarNode(node: N.Node): node is N.ScalarNode<any, any, any, any, any, any> {
	return node.tag === 'Scalar'
}

export function isSumNode(node: N.Node): node is N.SumNode<any, any, any, any, any, any> {
	return node.tag === 'Sum'
}
