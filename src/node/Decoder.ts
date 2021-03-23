import * as D from '../model/Decoder';
import { Node } from './Node';
import { TypeOf, TypeOfPartial, TypeOfPartialInput, TypeOfStrictInput } from './shared';

export function useStrictNodeDecoder<N extends Node>(node: N): D.Decoder<TypeOfStrictInput<N>, TypeOf<N>> {
	return useNodeDecoder(node, true);
}

export function usePartialNodeDecoder<N extends Node>(node: N): D.Decoder<TypeOfPartialInput<N>, TypeOfPartial<N>> {
	return useNodeDecoder(node, false);
}

function useNodeDecoder(node: Node, isStrict: boolean): any {
	switch (node.tag) {
		case 'String':
			return D.string;
		case 'Int':
			return D.int;
		case 'Boolean':
			return D.boolean;
		case 'Float':
			return D.float;
		case 'Scalar':
			return node;
		case 'Option':
			return D.option(useNodeDecoder(node.item, isStrict));
		case 'Array':
			return D.array(useNodeDecoder(node.item, isStrict));
		case 'NonEmptyArray':
			return D.nonEmptyArray(useNodeDecoder(node.item, isStrict));
		case 'Map':
			return D.fromMap(Object.entries)(useNodeDecoder(node.key, isStrict), useNodeDecoder(node.item, isStrict));
		case 'Type':
			const typeEncoders: any = {};
			for (const [key, value] of Object.entries(node.members)) {
				typeEncoders[key] = useNodeDecoder(value as Node, isStrict);
			}
			return isStrict ? D.fromType(typeEncoders) : D.fromPartial(typeEncoders);
		case 'Sum':
			const sumEncoders: any = {};
			for (const [key, value] of Object.entries(node.membersRecord)) {
				sumEncoders[key] = useNodeDecoder(value as Node, isStrict);
			}
			return D.sum('__typename')(sumEncoders);
		case 'Mutation':
			return useNodeDecoder(node.result, isStrict);
	}
}
