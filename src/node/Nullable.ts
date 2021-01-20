import { nullable as nullableModel } from '../model/Model'
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
	Ref,
	ModifyCacheEntryIfEntity
} from './shared'

export interface NullableNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		TypeOfStrictInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Item> | null>,
		TypeOf<Item> | null,
		TypeOfPartialInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Item> | null>,
		TypeOfPartial<Item> | null,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Item>, Ref<TypeOfCacheEntry<Item> | null>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Nullable'
	readonly item: Item
	readonly __customCache?: CustomCache<
		TypeOfPartial<Item> | null,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Item>, Ref<TypeOfCacheEntry<Item> | null>>
	>
}

export interface StaticNullableNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean, IsEntity extends boolean>
	extends StaticNodeConfig<
		TypeOfPartial<Item> | null,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Item>, Ref<TypeOfCacheEntry<Item> | null>>,
		{},
		IsLocal,
		IsEntity
	> {}

export interface DynamicNullableNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		TypeOfPartial<Item> | null,
		ModifyCacheEntryIfEntity<IsEntity, TypeOf<Item>, Ref<TypeOfCacheEntry<Item> | null>>,
		{},
		IsLocal
	> {}

const NULLABLE_TAG = 'Nullable'

function useNullableModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(
		nullableModel(isStrict ? item.strict : item.partial),
		isLocal,
		!item.__hasTransformations.encoding,
		!item.__hasTransformations.decoding
	)
}

export function nullable<Item extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(
	item: Item,
	config?: StaticNullableNodeConfig<Item, IsLocal, IsEntity>
): NullableNode<Item, {}, IsLocal, IsEntity>
export function nullable<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config: DynamicNullableNodeConfig<Item, Variables, IsLocal, IsEntity>
): NullableNode<Item, Variables, IsLocal, IsEntity>
export function nullable<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config?:
		| StaticNullableNodeConfig<Item, IsLocal, IsEntity>
		| DynamicNullableNodeConfig<Item, Variables, IsLocal, IsEntity>
): NullableNode<Item, Variables, IsLocal, IsEntity> {
	return {
		tag: NULLABLE_TAG,
		item,
		strict: useNullableModel(item, !!config?.isLocal, true),
		partial: useNullableModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: item.__hasTransformations,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
