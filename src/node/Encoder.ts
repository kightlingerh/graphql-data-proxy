import * as E from '../model/Encoder';
import { Node } from './Node';
import { _HasEncodingTransformations, TypeOf, TypeOfStrictOutput } from './shared';

export function useNodeEncoder<N extends Node>(node: N): E.Encoder<TypeOfStrictOutput<N>, TypeOf<N>> {
	if (!node[_HasEncodingTransformations]) {
		return E.id() as E.Encoder<TypeOfStrictOutput<N>, TypeOf<N>>;
	}
	switch (node.tag) {
		case 'String':
			return E.string as any;
		case 'Int':
			return E.int as any;
		case 'Boolean':
			return E.boolean as any;
		case 'Float':
			return E.float as any;
		case 'Scalar':
			return node as any;
		case 'Option':
			return E.option(useNodeEncoder((node as any).item)) as any;
		case 'Array':
			return E.array(useNodeEncoder((node as any).item)) as any;
		case 'NonEmptyArray':
			return E.nonEmptyArray(useNodeEncoder((node as any).item)) as any;
		case 'Map':
			return E.map(Object.fromEntries)(
				useNodeEncoder((node as any).key),
				useNodeEncoder((node as any).item)
			) as any;
		case 'Type':
			if ((node as any).encode) {
				return node as any;
			}
			const typeEncoders: any = {};
			for (const [key, value] of Object.entries((node as any).members)) {
				typeEncoders[key] = useNodeEncoder(value as Node);
			}
			return E.type(typeEncoders) as any;
		case 'Sum':
			const sumEncoders: any = {};
			for (const [key, value] of Object.entries((node as any).membersRecord)) {
				sumEncoders[key] = useNodeEncoder(value as Node);
			}
			return E.sum('__typename')(sumEncoders) as any;
		case 'Mutation':
			return useNodeEncoder((node as any).result) as any;
	}
}
