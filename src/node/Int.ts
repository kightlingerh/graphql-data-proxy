import { Option } from 'fp-ts/lib/Option';
import { Int } from '../model/Guard';
import {
	BaseNode,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	PrimitiveNodeOptions
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
	constructor(readonly options?: PrimitiveNodeOptions<Variables, IsLocal>) {
		super(options?.variables);
	}
}

export function int<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: PrimitiveNodeOptions<Variables, IsLocal>
): IntNode<Variables, IsLocal> {
	return new IntNode<Variables, IsLocal>(options);
}

export const staticInt = /*#__PURE__*/ int();
