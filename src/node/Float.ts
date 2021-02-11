import { Option } from 'fp-ts/lib/Option'
import { Float } from '../model/Guard'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	StaticNodeConfig
} from './shared'

export interface FloatNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		number,
		ModifyOutputIfLocal<IsLocal, number>,
		Float,
		number,
		ModifyOutputIfLocal<IsLocal, number>,
		Float,
		Ref<Option<Float>>,
		Variables
	> {
	readonly tag: 'Float'
}

export interface StaticFloatNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {}

export interface DynamicFloatNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, IsLocal> {}

const FLOAT_TAG = 'Float'

export function float<IsLocal extends boolean = false>(config?: StaticFloatNodeConfig<IsLocal>): FloatNode<{}, IsLocal>
export function float<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicFloatNodeConfig<V, IsLocal>
): FloatNode<V, IsLocal>
export function float<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticFloatNodeConfig<IsLocal> | DynamicFloatNodeConfig<V, IsLocal>
): FloatNode<V, IsLocal> {
	return {
		tag: FLOAT_TAG,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasDecodingTransformations: false,
		__hasEncodingTransformations: false,
		__isLocal: config?.isLocal
	}
}

export const staticFloat = /*#__PURE__*/ float()
