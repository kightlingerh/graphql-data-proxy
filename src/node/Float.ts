import { Option } from 'fp-ts/lib/Option';
import { Float } from '../model/Guard';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	PrimitiveNodeOptions,
	BaseNode,
	_HasDecodingTransformations,
	_HasEncodingTransformations
} from './shared';


export class FloatNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<
	number,
	ModifyOutputIfLocal<IsLocal, number>,
	Float,
	number,
	ModifyOutputIfLocal<IsLocal, number>,
	Float,
	Ref<Option<Float>>,
	Variables
> {
	readonly tag = 'Float';
	readonly [_HasDecodingTransformations] = false;
	readonly [_HasEncodingTransformations] = false;
	constructor(options?: PrimitiveNodeOptions<Variables>) {
		super(options);
	}
}

export function float<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: PrimitiveNodeOptions<V>
): FloatNode<V, IsLocal> {
	return new FloatNode<V, IsLocal>(options);
}

export const staticFloat = /*#__PURE__*/ float();
