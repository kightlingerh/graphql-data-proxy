import * as G from '../model/Guard';
import { Node } from './Node';
import { TypeOf, TypeOfPartial } from './shared';

export function useStrictNodeGuard<N extends Node>(node: Node): G.Guard<unknown, TypeOf<N>> {
	return useNodeGuard(node, true);
}

export function usePartialNodeEq<N extends Node>(node: Node): G.Guard<unknown, TypeOfPartial<N>> {
	return useNodeGuard(node, false);
}

function useNodeGuard(node: Node, isStrict: boolean): any {
	switch (node.tag) {
		case 'String':
			return G.string;
		case 'Int':
			return G.int;
		case 'Boolean':
			return G.boolean;
		case 'Float':
			return G.float;
		case 'Scalar':
			return node;
		case 'Option':
			return G.option(useNodeGuard(node.item, isStrict));
		case 'Array':
			return G.array(useNodeGuard(node.item, isStrict));
		case 'NonEmptyArray':
			return G.nonEmptyArray(useNodeGuard(node.item, isStrict));
		case 'Map':
			return G.map(useNodeGuard(node.key, isStrict), useNodeGuard(node.item, isStrict));
		case 'Type':
			const typeEncoders: any = {};
			for (const [key, value] of Object.entries(node.members)) {
				typeEncoders[key] = useNodeGuard(value as Node, isStrict);
			}
			return isStrict ? G.type(typeEncoders) : G.partial(typeEncoders);
		case 'Sum':
			const sumEncoders: any = {};
			for (const [key, value] of Object.entries(node.membersRecord)) {
				sumEncoders[key] = useNodeGuard(value as Node, isStrict);
			}
			return G.sum('__typename')(sumEncoders);
		case 'Mutation':
			return useNodeGuard(node.result, isStrict);
	}
}

