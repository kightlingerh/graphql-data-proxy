import * as EQ from '../model/Eq';
import { Node } from './Node';
import { TypeOf, TypeOfPartial } from './shared';

export function useStrictNodeEq<N extends Node>(node: N): EQ.Eq<TypeOf<N>> {
	return useNodeEq(node, true);
}

export function usePartialNodeEq<N extends Node>(node: N): EQ.Eq<TypeOfPartial<N>> {
	return useNodeEq(node, false);
}

function useNodeEq(node: Node, isStrict: boolean): any {
	switch (node.tag) {
		case 'String':
			return EQ.string;
		case 'Int':
			return EQ.int;
		case 'Boolean':
			return EQ.boolean;
		case 'Float':
			return EQ.float;
		case 'Scalar':
			return node;
		case 'Option':
			return EQ.option(useNodeEq(node.item, isStrict));
		case 'Array':
			return EQ.array(useNodeEq(node.item, isStrict));
		case 'NonEmptyArray':
			return EQ.nonEmptyArray(useNodeEq(node.item, isStrict));
		case 'Map':
			return EQ.map(useNodeEq(node.key, isStrict), useNodeEq(node.item, isStrict));
		case 'Type':
			if (node.equals) {
				return node;
			}
			const typeEncoders: any = {};
			for (const [key, value] of Object.entries(node.members)) {
				typeEncoders[key] = useNodeEq(value as Node, isStrict);
			}
			return isStrict ? EQ.type(typeEncoders) : EQ.partial(typeEncoders);
		case 'Sum':
			const sumEncoders: any = {};
			for (const [key, value] of Object.entries(node.membersRecord)) {
				sumEncoders[key] = useNodeEq(value as Node, isStrict);
			}
			return EQ.sum('__typename')(sumEncoders);
		case 'Mutation':
			return useNodeEq(node.result, isStrict);
	}
}
