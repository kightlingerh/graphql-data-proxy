import { Option } from 'fp-ts/lib/Option';
import { Float } from '../model/Guard';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	PrimitiveNodeOptions,
	BaseNode
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
	constructor(readonly options?: PrimitiveNodeOptions<Variables, IsLocal>) {
		super(options?.variables);
	}
}

export function float<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: PrimitiveNodeOptions<Variables, IsLocal>
): FloatNode<Variables, IsLocal> {
	return new FloatNode<Variables, IsLocal>(options);
}

export const staticFloat = /*#__PURE__*/ float();
