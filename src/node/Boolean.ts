import { Option } from 'fp-ts/lib/Option'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	StaticNodeConfig
} from './shared'

export interface BooleanNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		boolean,
		ModifyOutputIfLocal<IsLocal, boolean>,
		boolean,
		boolean,
		ModifyOutputIfLocal<IsLocal, boolean>,
		boolean,
		Ref<Option<boolean>>,
		Variables
	> {
	readonly tag: 'Boolean'
}

export interface StaticBooleanNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {}

export interface DynamicBooleanNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, IsLocal> {}

const BOOLEAN_TAG = 'Boolean'

export function boolean<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicBooleanNodeConfig<V, IsLocal>
): BooleanNode<V, IsLocal>
export function boolean<IsLocal extends boolean = false>(
	config?: StaticBooleanNodeConfig<IsLocal>
): BooleanNode<{}, IsLocal>
export function boolean<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticBooleanNodeConfig<IsLocal> | DynamicBooleanNodeConfig<V, IsLocal>
): BooleanNode<V, IsLocal> {
	return {
		tag: BOOLEAN_TAG,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasEncodingTransformations: false,
		__hasDecodingTransformations: false,
		__isLocal: config?.isLocal
	}
}

export const staticBoolean = /*#__PURE__*/ boolean()
