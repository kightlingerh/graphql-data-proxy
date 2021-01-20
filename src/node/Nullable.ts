import * as M from '../model/Model'
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
	Ref
} from './shared'

export interface NullableNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		TypeOfStrictInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Item> | null>,
		TypeOf<Item> | null,
		TypeOfPartialInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Item> | null>,
		TypeOfPartial<Item> | null,
		Ref<TypeOfCacheEntry<Item> | null>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Nullable'
	readonly item: Item
	readonly __customCache?: CustomCache<
		TypeOfPartial<Item> | null,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		Ref<TypeOfCacheEntry<Item> | null>
	>
}

export interface StaticNullableNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean>
	extends StaticNodeConfig<TypeOfPartial<Item> | null, Ref<TypeOfCacheEntry<Item> | null>, {}, IsLocal> {}

export interface DynamicNullableNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean
> extends DynamicNodeConfig<Variables, TypeOfPartial<Item> | null, Ref<TypeOfCacheEntry<Item> | null>, {}, IsLocal> {}

const NULLABLE_TAG = 'Nullable'

function getNullableModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(
		M.nullable(isStrict ? item.strict : item.partial),
		isLocal,
		!item.__hasTransformations.encoding,
		!item.__hasTransformations.decoding
	)
}

export function nullable<Item extends AnyBaseNode, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticNullableNodeConfig<Item, IsLocal>
): NullableNode<Item, {}, IsLocal>
export function nullable<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false>(
	item: Item,
	config: DynamicNullableNodeConfig<Item, Variables, IsLocal>
): NullableNode<Item, Variables, IsLocal>
export function nullable<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>(
	item: Item,
	config?: StaticNullableNodeConfig<Item, IsLocal> | DynamicNullableNodeConfig<Item, Variables, IsLocal>
): NullableNode<Item, Variables, IsLocal> {
	return {
		tag: NULLABLE_TAG,
		item,
		strict: getNullableModel(item, !!config?.isLocal, true),
		partial: getNullableModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: item.__hasTransformations,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
