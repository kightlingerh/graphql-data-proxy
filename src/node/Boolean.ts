import { Option } from 'fp-ts/lib/Option';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	BaseNode,
	NodeOptions,
	_HasEncodingTransformations,
	_HasDecodingTransformations
} from './shared';

export type BooleanNodeOptions<Variables extends NodeVariables = {}> = NodeOptions<boolean, Variables>;

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
	readonly [_HasEncodingTransformations] = false;
	readonly [_HasDecodingTransformations] = false;
	constructor(options?: BooleanNodeOptions<Variables>) {
		super(options);
	}
}

export function boolean<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	options?: BooleanNodeOptions<V>
): BooleanNode<V, IsLocal> {
	return new BooleanNode<V, IsLocal>(options);
}

export const staticBoolean = /*#__PURE__*/ boolean();
