import { Option } from 'fp-ts/lib/Option';
import { Int } from '../model/Guard';
import {
	BaseNode,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	BaseNodeOptions
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
	constructor(readonly options?: BaseNodeOptions<IsLocal, true, Variables>) {
		super(options?.variables);
	}
}

export function int<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: BaseNodeOptions<IsLocal, true, Variables>
): IntNode<Variables, IsLocal> {
	return new IntNode<Variables, IsLocal>(options);
}

export const staticInt = /*#__PURE__*/ int();
