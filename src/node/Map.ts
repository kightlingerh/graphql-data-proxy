import { fromMap } from '../model'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	ModifyOutputIfLocal,
	AnyBaseNode,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfPartial,
	HAS_TRANSFORMATIONS,
	TypeOfCacheEntry,
	ModifyIfEntity,
	TypeOfRefs,
	CustomCache,
	ExtractNodeDefinitionType
} from './shared'

export interface MapNode<
	StrictInput,
	StrictOutput,
	PartialInput,
	PartialOutput,
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		StrictInput,
		ModifyOutputIfLocal<IsLocal, StrictOutput>,
		Map<TypeOf<Key>, TypeOf<Item>>,
		PartialInput,
		ModifyOutputIfLocal<IsLocal, PartialOutput>,
		Map<TypeOf<Key>, TypeOfPartial<Item>>,
		ModifyIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfCacheEntry<Item>>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>,
		ModifyIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfRefs<Item>>>
	> {
	readonly tag: 'Map'
	readonly key: Key
	readonly item: Item
	readonly name?: string
	readonly __customCache?: CustomCache<
		Map<TypeOf<Key>, TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		ModifyIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfCacheEntry<Item>>>
	>
}

export interface StaticMapNodeConfig<
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	IsLocal extends boolean,
	IsEntity extends boolean
> extends StaticNodeConfig<IsLocal, IsEntity> {
	readonly name?: string
	readonly useCustomCache?: CustomCache<
		Map<TypeOf<Key>, TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>>,
		ModifyIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfCacheEntry<Item>>>
	>
}

export interface DynamicMapNodeConfig<
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {
	readonly name?: string
	readonly useCustomCache?: CustomCache<
		Map<TypeOf<Key>, TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		ModifyIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfCacheEntry<Item>>>
	>
}

const MAP_TAG = 'Map'

export function map<
	StrictInput,
	StrictOutput,
	PartialInput,
	PartialOutput,
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	config?: StaticMapNodeConfig<Key, Item, IsLocal, IsEntity>
): MapNode<StrictInput, StrictOutput, PartialInput, PartialOutput, Key, Item, {}, IsLocal, IsEntity>
export function map<
	StrictInput,
	StrictOutput,
	PartialInput,
	PartialOutput,
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	config: DynamicMapNodeConfig<Key, Item, Variables, IsLocal, IsEntity>
): MapNode<StrictInput, StrictOutput, PartialInput, PartialOutput, Key, Item, Variables, IsLocal, IsEntity>
export function map<
	StrictInput,
	StrictOutput,
	PartialInput,
	PartialOutput,
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	config?:
		| StaticMapNodeConfig<Key, Item, IsLocal, IsEntity>
		| DynamicMapNodeConfig<Key, Item, Variables, IsLocal, IsEntity>
): MapNode<StrictInput, StrictOutput, PartialInput, PartialOutput, Key, Item, Variables, IsLocal, IsEntity> {
	return {
		tag: MAP_TAG,
		item,
		key,
		strict: fromMap(key.strict as any, item.strict) as any,
		partial: fromMap(key.partial as any, item.partial) as any,
		variables: config?.variables ?? EMPTY_VARIABLES,
		name: config?.name,
		__hasTransformations: HAS_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
