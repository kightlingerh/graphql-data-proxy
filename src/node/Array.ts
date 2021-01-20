import { fromArray } from '../model'
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

export interface ArrayNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		Array<TypeOfStrictInput<Item>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfStrictOutput<Item>>>,
		Array<TypeOf<Item>>,
		Array<TypeOfPartialInput<Item>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfPartialOutput<Item>>>,
		Array<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, Array<TypeOf<Item>>, Array<TypeOfCacheEntry<Item>>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Array'
	readonly item: Item
	readonly __customCache?: CustomCache<
		Array<TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		ModifyCacheEntryIfEntity<IsEntity, Array<TypeOf<Item>>, Array<TypeOfCacheEntry<Item>>>
	>
}

export interface StaticArrayNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean, IsEntity extends boolean>
	extends StaticNodeConfig<
		Array<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, Array<TypeOf<Item>>, Array<TypeOfCacheEntry<Item>>>,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>,
		IsLocal,
		IsEntity
	> {}

export interface DynamicArrayNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		Array<TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, Array<TypeOf<Item>>, Array<TypeOfCacheEntry<Item>>>,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>,
		IsLocal,
		IsEntity
	> {}

const ARRAY_TAG = 'Array'

function useArrayModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(
		fromArray(isStrict ? item.strict : item.partial),
		isLocal,
		!item.__hasTransformations.encoding,
		!item.__hasTransformations.decoding
	)
}

export function array<Item extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(
	item: Item,
	config?: StaticArrayNodeConfig<Item, IsLocal, IsEntity>
): ArrayNode<Item, {}, IsLocal, IsEntity>
export function array<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config: DynamicArrayNodeConfig<Item, Variables, IsLocal, IsEntity>
): ArrayNode<Item, Variables, IsLocal, IsEntity>
export function array<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config?: StaticArrayNodeConfig<Item, IsLocal, IsEntity> | DynamicArrayNodeConfig<Item, Variables, IsLocal, IsEntity>
): ArrayNode<Item, Variables, IsLocal, IsEntity> {
	return {
		tag: ARRAY_TAG,
		item,
		strict: useArrayModel(item, !!config?.isLocal, true),
		partial: useArrayModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: item.__hasTransformations,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
