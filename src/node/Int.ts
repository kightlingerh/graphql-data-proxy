import { Option } from 'fp-ts/lib/Option';
import { Int } from '../model/Guard';
import {
	BaseNode,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	NodeOptions,
	_HasEncodingTransformations,
	_HasDecodingTransformations
} from './shared';

export type IntNodeOptions<Variables extends NodeVariables = {}> = NodeOptions<number, Variables>;

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
}

export function int<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: IntNodeOptions<V>
): IntNode<V, IsLocal> {
	return new IntNode<V, IsLocal>(options);
}

export const staticInt = /*#__PURE__*/ int();
