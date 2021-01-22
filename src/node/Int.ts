import { Option } from 'fp-ts/Option'
import { Int } from '../model/Guard'
import { int as intModel } from '../model/Model'
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
	const model = config?.isLocal ? useLocalModel(intModel) : (intModel as any)
	return {
		tag: INT_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__isLocal: config?.isLocal
	}
}

export const staticInt = int()
