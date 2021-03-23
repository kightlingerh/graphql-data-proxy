import { Option } from 'fp-ts/lib/Option';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	PrimitiveNodeOptions,
	BaseNode,
	_HasDecodingTransformations,
	_HasEncodingTransformations
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
	readonly [_HasDecodingTransformations] = false;
	readonly [_HasEncodingTransformations] = false;
	constructor(options?: PrimitiveNodeOptions<Variables>) {
		super(options);
	}
}

export function string<Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: PrimitiveNodeOptions<Variables>
): StringNode<Variables, IsLocal> {
	return new StringNode(options);
}

export const staticString = /*#__PURE__*/ string();
