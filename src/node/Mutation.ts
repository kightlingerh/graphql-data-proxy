import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	getModel,
	ModifyOutputIfLocal,
	AnyBaseNode,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput
} from './shared'

export interface MutationNode<
	Result extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		TypeOfStrictInput<Result>,
		ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Result>>,
		TypeOf<Result>,
		TypeOfPartialInput<Result>,
		ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Result>>,
		TypeOfPartial<Result>,
		TypeOfPartial<Result>,
		Variables,
		ExtractSubVariablesDefinition<Result> & ExtractVariablesDefinition<Result>
	> {
	readonly tag: 'Mutation'
	readonly result: Result
	readonly __customCache?: CustomCache<
		TypeOfPartial<Result>,
		ExtractNodeDefinitionType<
			ExtractSubVariablesDefinition<Result> & ExtractVariablesDefinition<Result> & Variables
		>,
		TypeOfPartial<Result> | undefined
	>
}

export interface StaticMutationNodeConfig<Result extends AnyBaseNode, IsLocal extends boolean>
	extends StaticNodeConfig<TypeOfPartial<Result>, TypeOfPartial<Result> | undefined, {}, IsLocal> {}

export interface DynamicMutationNodeConfig<
	Result extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean
> extends DynamicNodeConfig<Variables, TypeOfPartial<Result>, TypeOfPartial<Result> | undefined, {}, IsLocal> {}

const MUTATION_TAG = 'Mutation'

export function mutation<Result extends AnyBaseNode, IsLocal extends boolean = false>(
	result: Result,
	config?: StaticMutationNodeConfig<Result, IsLocal>
): MutationNode<Result, {}, IsLocal>
export function mutation<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false>(
	result: Item,
	config: DynamicMutationNodeConfig<Item, Variables, IsLocal>
): MutationNode<Item, Variables, IsLocal>
export function mutation<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>(
	result: Item,
	config?: StaticMutationNodeConfig<Item, IsLocal> | DynamicMutationNodeConfig<Item, Variables, IsLocal>
): MutationNode<Item, Variables, IsLocal> {
	return {
		tag: MUTATION_TAG,
		result,
		strict: getModel(
			result.strict,
			!!config?.isLocal,
			result.__hasTransformations.encoding,
			result.__hasTransformations.decoding
		),
		partial: getModel(
			result.partial,
			!!config?.isLocal,
			result.__hasTransformations.encoding,
			result.__hasTransformations.decoding
		),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: result.__hasTransformations,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
