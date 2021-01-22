import { Option } from 'fp-ts/Option'
import { Float } from '../model/Guard'
import { float as floatModel } from '../model/Model'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ModifyOutputIfLocal,
	NO_TRANSFORMATIONS,
	NodeVariables,
	Ref,
	StaticNodeConfig,
	useLocalModel
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
	const model = config?.isLocal ? useLocalModel(floatModel) : (floatModel as any)
	return {
		tag: FLOAT_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__isLocal: config?.isLocal
	}
}

export const staticFloat = float()
