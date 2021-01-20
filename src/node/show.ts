import { Show } from 'fp-ts/lib/Show'
import { Node } from './Node'
import { SumNode } from './Sum'
import { TypeNode } from './Type'

export const showNode: Show<Node> = {
	show: (node) => {
		switch (node.tag) {
			case 'Scalar':
				return `Scalar: ${node.name}`
			case 'Map':
				return `Map<${showNode.show(node.key)}, ${showNode.show(node.item)}>`
			case 'Option':
				return `Option<${showNode.show(node.item)}>`
			case 'Array':
				return `Array<${showNode.show(node.item)}>`
			case 'Set':
				return `Set<${showNode.show(node.item)}>`
			case 'NonEmptyArray':
				return `NonEmptyArray<${showNode.show(node.item)}>`
			case 'Nullable':
				return `${showNode.show(node.item)} | null`
			case 'Sum':
				return showSumNode.show(node)
			case 'Type':
				return showTypeNode.show(node)
			default:
				return node.tag
		}
	}
}
export const showSumNode: Show<SumNode<any, any, any>> = {
	show: (node) =>
		`{\n  ${node.members
			.map((member: TypeNode<any, any, any, any>) => `${member.__typename}:  ${showTypeNode.show(member)}`)
			.join(',\n  ')}  \n}`
}
export const showTypeNode: Show<TypeNode<any, any, any, any>> = {
	show: (node) =>
		`{\n  ${Object.keys(node.members)
			.map((k) => `${k}: ${showNode.show(node.members[k])}`.trimEnd())
			.join(',\n')}  \n}`
}
