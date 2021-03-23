import { Option } from 'fp-ts/lib/Option';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	PrimitiveNodeOptions,
	BaseNode,
} from './shared';

export class StringNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<
	string,
	ModifyOutputIfLocal<IsLocal, string>,
	string,
	string,
	ModifyOutputIfLocal<IsLocal, string>,
	string,
	Ref<Option<string>>,
	Variables
> {
	readonly tag = 'String';
	constructor(readonly options?: PrimitiveNodeOptions<Variables, IsLocal>) {
		super(options?.variables);
	}
}

export function string<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: PrimitiveNodeOptions<Variables, IsLocal>
): StringNode<Variables, IsLocal> {
	return new StringNode(options);
}

export const staticString = /*#__PURE__*/ string();
