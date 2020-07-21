import { Show } from 'fp-ts/lib/Show'
import { Node, SumNode, TypeNode } from './Node'

export const showNode: Show<Node> = {
	show: (node) => {
		switch (node.tag) {
			case 'Scalar':
				return `Scalar: ${node.name}`
			case 'Map':
				return `Map<${showNode.show(node.key)}, ${showNode.show(node.wrapped)}>`
			case 'Option':
				return `Option<${showNode.show(node.wrapped)}>`
			case 'Array':
				return `Array<${showNode.show(node.wrapped)}`
			case 'NonEmptyArray':
				return `NonEmptyArray<${showNode.show(node.wrapped)}`
			case 'Sum':
				return showSumNode.show(node)
			case 'Type':
				return showTypeNode.show(node)
			default:
				return node.tag
		}
	}
}
export const showSumNode: Show<SumNode<TypeNode<any, any>[]>> = {
	show: (node) =>
		`{\n  ${node.members.map((member) => `${member.__typename}:  ${showTypeNode.show(member)}`).join(',\n  ')}  \n}`
}
export const showTypeNode: Show<TypeNode<any, any>> = {
	show: (node) =>
		`{\n  ${Object.keys(node.members)
			.map((k) => `${k}: ${showNode.show(node.members[k])}`.trimEnd())
			.join(',\n')}  \n}`
}
