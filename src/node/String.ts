import { Option } from 'fp-ts/Option'
import { string as stringModel } from '../model/Model'
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

const STRING_TAG = 'String'

export interface StringNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		string,
		ModifyOutputIfLocal<IsLocal, string>,
		string,
		string,
		ModifyOutputIfLocal<IsLocal, string>,
		string,
		Ref<Option<string>>,
		Variables
	> {
	readonly tag: 'String'
}

export interface StaticStringNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {}

export interface DynamicStringNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, IsLocal> {}

export function string<IsLocal extends boolean = false>(
	config?: StaticStringNodeConfig<IsLocal>
): StringNode<{}, IsLocal>
export function string<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicStringNodeConfig<V, IsLocal>
): StringNode<V, IsLocal>
export function string<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticStringNodeConfig<IsLocal> | DynamicStringNodeConfig<V, IsLocal>
): StringNode<V, IsLocal> {
	const model = config?.isLocal ? useLocalModel(stringModel) : (stringModel as any)
	return {
		tag: STRING_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__isLocal: config?.isLocal
	}
}

export const staticString = string()
