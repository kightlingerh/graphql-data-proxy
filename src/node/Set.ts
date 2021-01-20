import { fromSet } from '../model/Model'
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
	ModifyCacheEntryIfEntity
} from './shared'

export interface SetNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		Array<TypeOfStrictInput<Item>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfStrictOutput<Item>>>,
		Set<TypeOf<Item>>,
		Array<TypeOfPartialInput<Item>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfPartialOutput<Item>>>,
		Set<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, Set<TypeOf<Item>>, Set<TypeOfCacheEntry<Item>>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Set'
	readonly item: Item
	readonly __customCache?: CustomCache<
		Set<TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		ModifyCacheEntryIfEntity<IsEntity, Set<TypeOf<Item>>, Set<TypeOfCacheEntry<Item>>>
	>
}

export interface StaticSetNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean, IsEntity extends boolean>
	extends StaticNodeConfig<
		Set<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, Set<TypeOf<Item>>, Set<TypeOfCacheEntry<Item>>>,
		{},
		IsLocal
	> {}

export interface DynamicSetNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		Set<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, Set<TypeOf<Item>>, Set<TypeOfCacheEntry<Item>>>,
		{},
		IsLocal
	> {}

const SET_TAG = 'Set'

function useSetModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(
		fromSet(isStrict ? item.strict : item.partial),
		isLocal,
		item.__hasTransformations.encoding,
		item.__hasTransformations.decoding
	)
}

export function set<Item extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(
	item: Item,
	config?: StaticSetNodeConfig<Item, IsLocal, IsEntity>
): SetNode<Item, {}, IsLocal, IsEntity>
export function set<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config: DynamicSetNodeConfig<Item, Variables, IsLocal, IsEntity>
): SetNode<Item, Variables, IsLocal, IsEntity>
export function set<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config?: StaticSetNodeConfig<Item, IsLocal, IsEntity> | DynamicSetNodeConfig<Item, Variables, IsLocal, IsEntity>
): SetNode<Item, Variables, IsLocal, IsEntity> {
	return {
		tag: SET_TAG,
		item,
		strict: useSetModel(item, !!config?.isLocal, true),
		partial: useSetModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: HAS_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
