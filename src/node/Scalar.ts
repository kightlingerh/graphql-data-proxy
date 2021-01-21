import { Option } from 'fp-ts/Option'
import { Model } from '../model/Model'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	StaticNodeConfig,
	useLocalModel
} from './shared'

export interface ScalarNode<
	Name extends string,
	Input,
	Output,
	Data,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		Input,
		ModifyOutputIfLocal<IsLocal, Output>,
		Data,
		Input,
		ModifyOutputIfLocal<IsLocal, Output>,
		Data,
		Ref<Option<Data>>,
		Variables
	> {
	readonly tag: 'Scalar'
	readonly name: Name
}

export interface StaticScalarNodeConfig<IsLocal extends boolean>
	extends StaticNodeConfig<IsLocal> {
	hasEncodingTransformations?: boolean
	hasDecodingTransformations?: boolean
}

export interface DynamicScalarNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, IsLocal> {
	hasEncodingTransformations?: boolean
	hasDecodingTransformations?: boolean
}

const SCALAR_TAG = 'Scalar'

export function scalar<Name extends string, Input, Output, Data, IsLocal extends boolean = false>(
	name: Name,
	model: Model<Input, Output, Data>,
	config?: StaticScalarNodeConfig<IsLocal>
): ScalarNode<Name, Input, Output, Data, {}, IsLocal>
export function scalar<
	Name extends string,
	Input,
	Output,
	Data,
	V extends NodeVariables,
	IsLocal extends boolean = false
>(
	name: Name,
	model: Model<Input, Output, Data>,
	config: DynamicScalarNodeConfig<V, IsLocal>
): ScalarNode<Name, Input, Output, Data, V, IsLocal>
export function scalar<
	Name extends string,
	Input,
	Output,
	Data,
	V extends NodeVariables,
	IsLocal extends boolean = false
>(
	name: Name,
	model: Model<Input, Output, Data>,
	config?: StaticScalarNodeConfig<IsLocal> | DynamicScalarNodeConfig<V, IsLocal>
): ScalarNode<Name, Input, Output, Data, V, IsLocal> {
	const m = config?.isLocal ? useLocalModel(model) : (model as any)
	return {
		tag: SCALAR_TAG,
		name,
		strict: m,
		partial: m,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: {
			encoding: config?.hasEncodingTransformations ?? true,
			decoding: config?.hasDecodingTransformations ?? true
		},
		__isLocal: config?.isLocal
	}
}
