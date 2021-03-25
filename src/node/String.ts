import { Option } from 'fp-ts/lib/Option';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	BaseNodeOptions,
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
	constructor(readonly options?: BaseNodeOptions<IsLocal, true, Variables>) {
		super(options?.variables);
	}
}

export function string<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: BaseNodeOptions<IsLocal, true, Variables>
): StringNode<Variables, IsLocal> {
	return new StringNode(options);
}

export const staticString = /*#__PURE__*/ string();
