import { Option } from 'fp-ts/lib/Option';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	BaseNode,
	PrimitiveNodeOptions,
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
	constructor(readonly options?: PrimitiveNodeOptions<Variables, IsLocal>) {
		super(options?.variables);
	}
}

export function boolean<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: PrimitiveNodeOptions<Variables, IsLocal>
): BooleanNode<Variables, IsLocal> {
	return new BooleanNode<Variables, IsLocal>(options);
}

export const staticBoolean = /*#__PURE__*/ boolean();
