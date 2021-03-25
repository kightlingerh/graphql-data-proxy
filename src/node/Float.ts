import { Option } from 'fp-ts/lib/Option';
import { Float } from '../model/Guard';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	BaseNodeOptions,
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
	constructor(readonly options?: BaseNodeOptions<IsLocal, true, Variables>) {
		super(options?.variables);
	}
}

export function float<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: BaseNodeOptions<IsLocal, true, Variables>
): FloatNode<Variables, IsLocal> {
	return new FloatNode<Variables, IsLocal>(options);
}

export const staticFloat = /*#__PURE__*/ float();
