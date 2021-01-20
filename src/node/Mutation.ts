import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	useAdjustedModel,
	ModifyOutputIfLocal,
	AnyBaseNode,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	TypeOfCacheEntry,
	ModifyCacheEntryIfEntity
} from './shared'

export interface MutationNode<
	Result extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		TypeOfStrictInput<Result>,
		ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Result>>,
		TypeOf<Result>,
		TypeOfPartialInput<Result>,
		ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Result>>,
		TypeOfPartial<Result>,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Result>, TypeOfCacheEntry<Result>>,
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
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Result>, TypeOfCacheEntry<Result>>
	>
}

export interface StaticMutationNodeConfig<
	Result extends AnyBaseNode,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends StaticNodeConfig<
		TypeOfPartial<Result>,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Result>, TypeOfCacheEntry<Result>>,
		{},
		IsLocal
	> {}

export interface DynamicMutationNodeConfig<
	Result extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		TypeOfPartial<Result>,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Result>, TypeOfCacheEntry<Result>>,
		{},
		IsLocal
	> {}

const MUTATION_TAG = 'Mutation'

export function mutation<Result extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(
	result: Result,
	config?: StaticMutationNodeConfig<Result, IsLocal, IsEntity>
): MutationNode<Result, {}, IsLocal, IsEntity>
export function mutation<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	result: Item,
	config: DynamicMutationNodeConfig<Item, Variables, IsLocal, IsEntity>
): MutationNode<Item, Variables, IsLocal, IsEntity>
export function mutation<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	result: Item,
	config?:
		| StaticMutationNodeConfig<Item, IsLocal, IsEntity>
		| DynamicMutationNodeConfig<Item, Variables, IsLocal, IsEntity>
): MutationNode<Item, Variables, IsLocal, IsEntity> {
	return {
		tag: MUTATION_TAG,
		result,
		strict: useAdjustedModel(
			result.strict,
			!!config?.isLocal,
			result.__hasTransformations.encoding,
			result.__hasTransformations.decoding
		),
		partial: useAdjustedModel(
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
