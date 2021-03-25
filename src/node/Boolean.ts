import { Option } from 'fp-ts/lib/Option';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	BaseNode,
	BaseNodeOptions,
} from './shared';

export class BooleanNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<
	boolean,
	ModifyOutputIfLocal<IsLocal, boolean>,
	boolean,
	boolean,
	ModifyOutputIfLocal<IsLocal, boolean>,
	boolean,
	Ref<Option<boolean>>,
	Variables
> {
	readonly tag = 'Boolean';
	constructor(readonly options?: BaseNodeOptions<IsLocal, true, Variables>) {
		super(options?.variables);
	}
}

export function boolean<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: BaseNodeOptions<IsLocal, true, Variables>
): BooleanNode<Variables, IsLocal> {
	return new BooleanNode<Variables, IsLocal>(options);
}

export const staticBoolean = /*#__PURE__*/ boolean();
