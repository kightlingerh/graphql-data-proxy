import { Option } from 'fp-ts/lib/Option'
import { boolean as booleanModel } from '../model'
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

export function boolean<IsLocal extends boolean = false>(
	config?: StaticBooleanNodeConfig<IsLocal>
): BooleanNode<{}, IsLocal>
export function boolean<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicBooleanNodeConfig<V, IsLocal>
): BooleanNode<V, IsLocal>
export function boolean<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticBooleanNodeConfig<IsLocal> | DynamicBooleanNodeConfig<V, IsLocal>
): BooleanNode<V, IsLocal> {
	const model: any = config?.isLocal ? useLocalModel(booleanModel) : booleanModel
	return {
		tag: BOOLEAN_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__isLocal: config?.isLocal
	}
}

export const staticBoolean = boolean()
