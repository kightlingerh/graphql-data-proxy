import * as M from '../model/Model'
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
} from './shared'

const STRING_TAG = 'String'

export interface StringNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		string,
		ModifyOutputIfLocal<IsLocal, string>,
		string,
		string,
		ModifyOutputIfLocal<IsLocal, string>,
		string,
		string | undefined,
		Variables
	> {
	readonly tag: 'String'
	readonly __customCache?: CustomCache<string, ExtractNodeDefinitionType<Variables>, string | undefined>
}

export interface StaticStringNodeConfig<IsLocal extends boolean>
	extends StaticNodeConfig<string, string | undefined, {}, IsLocal> {}

export interface DynamicStringNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, string, string | undefined, {}, IsLocal> {}

export function string<IsLocal extends boolean = false>(
	config?: StaticStringNodeConfig<IsLocal>
): StringNode<{}, IsLocal>
export function string<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicStringNodeConfig<V, IsLocal>
): StringNode<V, IsLocal>
export function string<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticStringNodeConfig<IsLocal> | DynamicStringNodeConfig<V, IsLocal>
): StringNode<V, IsLocal> {
	const model = config?.isLocal ? useLocalModel(M.string) : (M.string as any)
	return {
		tag: STRING_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export const staticString = string()
