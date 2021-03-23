import { Option } from 'fp-ts/lib/Option'
import {
	INode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	StaticNodeConfig
} from './shared'

const STRING_TAG = 'String'

export interface StringNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends INode<
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

export function string<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicStringNodeConfig<V, IsLocal>
): StringNode<V, IsLocal>
export function string<IsLocal extends boolean = false>(
	config?: StaticStringNodeConfig<IsLocal>
): StringNode<{}, IsLocal>
export function string<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticStringNodeConfig<IsLocal> | DynamicStringNodeConfig<V, IsLocal>
): StringNode<V, IsLocal> {
	return {
		tag: STRING_TAG,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasDecodingTransformations: false,
		__hasEncodingTransformations: false,
		__isLocal: config?.isLocal
	}
}

export const staticString = /*#__PURE__*/ string()
