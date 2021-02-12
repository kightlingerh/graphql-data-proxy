import * as M from '../model/Model'
import { Node } from './Node'
import {
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput
} from './shared'

export function useStrictNodeModel<N extends Node>(
	node: N
): M.Model<TypeOfStrictInput<N>, TypeOfStrictOutput<N>, TypeOf<N>> {
	return useNodeModel(node, true)
}

export function usePartialNodeModel<N extends Node>(
	node: N
): M.Model<TypeOfPartialInput<N>, TypeOfPartialOutput<N>, TypeOfPartial<N>> {
	return useNodeModel(node, false)
}

function useNodeModel(node: Node, isStrict: boolean): any {
	switch (node.tag) {
		case 'String':
			return M.string
		case 'Int':
			return M.int
		case 'Boolean':
			return M.boolean
		case 'Float':
			return M.float
		case 'Scalar':
			return node
		case 'Option':
			return M.option(useNodeModel(node.item, isStrict))
		case 'Array':
			return M.array(useNodeModel(node.item, isStrict))
		case 'NonEmptyArray':
			return M.nonEmptyArray(useNodeModel(node.item, isStrict))
		case 'Map':
			return M.fromMap(useNodeModel(node.key, isStrict), useNodeModel(node.item, isStrict))
		case 'Type':
			const typeEncoders: any = {}
			for (const [key, value] of Object.entries(node.members)) {
				typeEncoders[key] = useNodeModel(value as Node, isStrict)
			}
			return isStrict ? M.fromType(typeEncoders) : M.fromPartial(typeEncoders)
		case 'Sum':
			const sumEncoders: any = {}
			for (const [key, value] of Object.entries(node.membersRecord)) {
				sumEncoders[key] = useNodeModel(value as Node, isStrict)
			}
			return M.sum('__typename')(sumEncoders)
		case 'Mutation':
			return useNodeModel(node.result, isStrict)
	}
}
