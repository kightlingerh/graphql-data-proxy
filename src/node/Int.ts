import { Option } from 'fp-ts/lib/Option'
import { Int } from '../model/Guard'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	StaticNodeConfig
} from './shared'

export interface IntNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		number,
		ModifyOutputIfLocal<IsLocal, number>,
		Int,
		number,
		ModifyOutputIfLocal<IsLocal, number>,
		Int,
		Ref<Option<Int>>,
		Variables
	> {
	readonly tag: 'Int'
}

export interface StaticIntNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {}

export interface DynamicIntNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, IsLocal> {}

const INT_TAG = 'Int'

export function int<IsLocal extends boolean = false>(config?: StaticIntNodeConfig<IsLocal>): IntNode<{}, IsLocal>
export function int<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicIntNodeConfig<V, IsLocal>
): IntNode<V, IsLocal>
export function int<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticIntNodeConfig<IsLocal> | DynamicIntNodeConfig<V, IsLocal>
): IntNode<V, IsLocal> {
	return {
		tag: INT_TAG,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasEncodingTransformations: false,
		__hasDecodingTransformations: false,
		__isLocal: config?.isLocal
	}
}

export const staticInt = /*#__PURE__*/ int()
