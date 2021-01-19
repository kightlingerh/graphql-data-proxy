import * as M from '../model/Model';
import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ModifyOutputIfLocal,
	NO_TRANSFORMATIONS,
	NodeVariables,
	StaticNodeConfig,
	useLocalModel
} from './shared';

export interface BooleanNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<boolean,
		ModifyOutputIfLocal<IsLocal, boolean>,
		boolean,
		boolean,
		ModifyOutputIfLocal<IsLocal, boolean>,
		boolean,
		boolean | undefined,
		Variables> {
	readonly tag: 'Boolean'
	readonly __customCache?: CustomCache<boolean, ExtractNodeDefinitionType<Variables>, boolean | undefined>
}

export interface StaticBooleanNodeConfig<IsLocal extends boolean>
	extends StaticNodeConfig<boolean, boolean | undefined, {}, IsLocal> {
}

export interface DynamicBooleanNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, boolean, boolean | undefined, {}, IsLocal> {
}

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
	const model = config?.isLocal ? useLocalModel(M.boolean) : (M.boolean as any)
	return {
		tag: BOOLEAN_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export const staticBoolean = boolean()
