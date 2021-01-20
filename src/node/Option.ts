import { Option } from 'fp-ts/Option'
import { fromOption as fromOptionModel } from '../model/Model'
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
	HAS_TRANSFORMATIONS,
	TypeOfCacheEntry,
	Ref,
	ModifyCacheEntryIfEntity
} from './shared'

export interface OptionNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		TypeOfStrictInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Item> | null>,
		Option<TypeOf<Item>>,
		TypeOfPartialInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Item> | null>,
		Option<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Item>, Ref<Option<TypeOfCacheEntry<Item>>>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Option'
	readonly item: Item
	readonly __customCache?: CustomCache<
		Option<TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Item>, Ref<Option<TypeOfCacheEntry<Item>>>>
	>
}

export interface StaticOptionNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean, IsEntity extends boolean>
	extends StaticNodeConfig<
		Option<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Item>, Ref<Option<TypeOfCacheEntry<Item>>>>,
		{},
		IsLocal
	> {}

export interface DynamicOptionNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		Option<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Item>, Ref<Option<TypeOfCacheEntry<Item>>>>,
		{},
		IsLocal
	> {}

const OPTION_TAG = 'Option'

function useOptionModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(fromOptionModel(isStrict ? item.strict : item.partial), isLocal, false, false)
}

export function option<Item extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(
	item: Item,
	config?: StaticOptionNodeConfig<Item, IsLocal, IsEntity>
): OptionNode<Item, {}, IsLocal, IsEntity>
export function option<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(item: Item, config: DynamicOptionNodeConfig<Item, Variables, IsLocal, IsEntity>): OptionNode<Item, Variables, IsLocal>
export function option<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config?:
		| StaticOptionNodeConfig<Item, IsLocal, IsEntity>
		| DynamicOptionNodeConfig<Item, Variables, IsLocal, IsEntity>
): OptionNode<Item, Variables, IsLocal, IsEntity> {
	return {
		tag: OPTION_TAG,
		item,
		strict: useOptionModel(item, !!config?.isLocal, true),
		partial: useOptionModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: HAS_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
