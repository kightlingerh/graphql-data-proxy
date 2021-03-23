import { Option } from 'fp-ts/lib/Option';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	NodeOptions,
	BaseNode,
	_HasDecodingTransformations,
	_HasEncodingTransformations
} from './shared';

export type StringNodeOptions<Variables extends NodeVariables = {}> = NodeOptions<string, Variables>;

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
	constructor(options?: StringNodeOptions<Variables>) {
		super(options);
	}
}

export function string<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: StringNodeOptions<V>
): StringNode<V, IsLocal> {
	return new StringNode(options);
}

export const staticString = /*#__PURE__*/ string();
