import { Option } from 'fp-ts/lib/Option';
import { Int } from '../model/Guard';
import {
	BaseNode,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	PrimitiveNodeOptions,
	_HasEncodingTransformations,
	_HasDecodingTransformations
} from './shared';

export class IntNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<
	number,
	ModifyOutputIfLocal<IsLocal, number>,
	Int,
	number,
	ModifyOutputIfLocal<IsLocal, number>,
	Int,
	Ref<Option<Int>>,
	Variables
> {
	readonly tag = 'Int';
	readonly [_HasEncodingTransformations] = false;
	readonly [_HasDecodingTransformations] = false;
	constructor(options?: PrimitiveNodeOptions<Variables>) {
		super(options);
	}
}

export function int<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: PrimitiveNodeOptions<V>
): IntNode<V, IsLocal> {
	return new IntNode<V, IsLocal>(options);
}

export const staticInt = /*#__PURE__*/ int();
