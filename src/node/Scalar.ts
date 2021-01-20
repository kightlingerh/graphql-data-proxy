import { Option } from 'fp-ts/Option'
import { Model } from '../model/Model'
import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
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
	readonly __customCache?: CustomCache<Data, ExtractNodeDefinitionType<Variables>, Ref<Option<Data>>>
}

export interface StaticScalarNodeConfig<Data, IsLocal extends boolean>
	extends StaticNodeConfig<Data, Ref<Option<Data>>, {}, IsLocal> {
	hasEncodingTransformations?: boolean
	hasDecodingTransformations?: boolean
}

export interface DynamicScalarNodeConfig<Data, Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, Data, Ref<Option<Data>>, {}, IsLocal> {
	hasEncodingTransformations?: boolean
	hasDecodingTransformations?: boolean
}

const SCALAR_TAG = 'Scalar'

export function scalar<Name extends string, Input, Output, Data, IsLocal extends boolean = false>(
	name: Name,
	model: Model<Input, Output, Data>,
	config?: StaticScalarNodeConfig<Data, IsLocal>
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
	config: DynamicScalarNodeConfig<Data, V, IsLocal>
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
	config?: StaticScalarNodeConfig<Data, IsLocal> | DynamicScalarNodeConfig<Data, V, IsLocal>
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
		__customCache: config?.useCustomCache,
		__isLocal: config?.isLocal
	}
}
