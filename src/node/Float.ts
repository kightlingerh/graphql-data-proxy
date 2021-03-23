import { Option } from 'fp-ts/lib/Option';
import { Float } from '../model/Guard';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	NodeOptions,
	BaseNode,
	_HasDecodingTransformations,
	_HasEncodingTransformations
} from './shared';

export type FloatNodeOptions<Variables extends NodeVariables = {}> = NodeOptions<number, Variables>;

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
}

export function float<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: FloatNodeOptions<V>
): FloatNode<V, IsLocal> {
	return new FloatNode<V, IsLocal>(options);
}

export const staticFloat = /*#__PURE__*/ float();
