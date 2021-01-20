import { identity } from 'fp-ts/function'
import { fromMap } from '../model/Model'
import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
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
		ModifyCacheEntryIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfCacheEntry<Item>>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Map'
	readonly key: Key
	readonly item: Item
	readonly name?: string
	readonly __customCache?: CustomCache<
		Map<TypeOf<Key>, TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		ModifyCacheEntryIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfCacheEntry<Item>>>
	>
}

export interface StaticMapNodeConfig<
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends StaticNodeConfig<
		Map<TypeOf<Key>, TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfCacheEntry<Item>>>,
		{},
		IsLocal
	> {
	readonly name?: string
}

export interface DynamicMapNodeConfig<
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		Map<TypeOf<Key>, TypeOfPartial<Item>>,
		ModifyCacheEntryIfEntity<IsEntity, Map<TypeOf<Key>, TypeOf<Item>>, Map<TypeOf<Key>, TypeOfCacheEntry<Item>>>,
		{},
		IsLocal
	> {
	readonly name?: string
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
	toPairs: (i: PartialInput) => Array<[TypeOfPartialInput<Key>, TypeOfPartialOutput<Item>]>,
	fromPairs: (pairs: Array<[TypeOfPartialInput<Key>, TypeOfPartialOutput<Item>]>) => PartialOutput,
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
	toPairs: (i: PartialInput) => Array<[TypeOfPartialInput<Key>, TypeOfPartialOutput<Item>]>,
	fromPairs: (pairs: Array<[TypeOfPartialInput<Key>, TypeOfPartialOutput<Item>]>) => PartialOutput,
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
	toPairs: (i: PartialInput) => Array<[TypeOfPartialInput<Key>, TypeOfPartialOutput<Item>]>,
	fromPairs: (pairs: Array<[TypeOfPartialInput<Key>, TypeOfPartialOutput<Item>]>) => PartialOutput,
	key: Key,
	item: Item,
	config?:
		| StaticMapNodeConfig<Key, Item, IsLocal, IsEntity>
		| DynamicMapNodeConfig<Key, Item, Variables, IsLocal, IsEntity>
): MapNode<StrictInput, StrictOutput, PartialInput, PartialOutput, Key, Item, Variables, IsLocal, IsEntity> {
	const model = fromMap(toPairs, fromPairs)
	return {
		tag: MAP_TAG,
		item,
		key,
		strict: model(key.strict, item.strict) as any,
		partial: model(key.partial, item.partial) as any,
		variables: config?.variables ?? EMPTY_VARIABLES,
		name: config?.name,
		__hasTransformations: HAS_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

function toTuplePairs(map: Map<unknown, unknown>): Array<[unknown, unknown]> {
	return [...map.entries()]
}

export function tupleMap<
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	config?: StaticMapNodeConfig<Key, Item, IsLocal, IsEntity>
): MapNode<
	Array<[TypeOfStrictInput<Key>, TypeOfStrictInput<Item>]>,
	Array<[TypeOfStrictOutput<Key>, TypeOfStrictOutput<Item>]>,
	Array<[TypeOfPartialInput<Key>, TypeOfPartialInput<Item>]>,
	Array<[TypeOfPartialOutput<Key>, TypeOfPartialOutput<Item>]>,
	Key,
	Item,
	{},
	IsLocal
>
export function tupleMap<
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	config: DynamicMapNodeConfig<Key, Item, Variables, IsLocal, IsEntity>
): MapNode<
	Array<[TypeOfStrictInput<Key>, TypeOfStrictInput<Item>]>,
	Array<[TypeOfStrictOutput<Key>, TypeOfStrictOutput<Item>]>,
	Array<[TypeOfPartialInput<Key>, TypeOfPartialInput<Item>]>,
	Array<[TypeOfPartialOutput<Key>, TypeOfPartialOutput<Item>]>,
	Key,
	Item,
	Variables,
	IsLocal
>
export function tupleMap<
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
): MapNode<
	Array<[TypeOfStrictInput<Key>, TypeOfStrictInput<Item>]>,
	Array<[TypeOfStrictOutput<Key>, TypeOfStrictOutput<Item>]>,
	Array<[TypeOfPartialInput<Key>, TypeOfPartialInput<Item>]>,
	Array<[TypeOfPartialOutput<Key>, TypeOfPartialOutput<Item>]>,
	Key,
	Item,
	Variables,
	IsLocal,
	IsEntity
> {
	return map(identity as any, toTuplePairs as any, key, item, config as any) as any
}

export function recordMap<
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	config?: StaticMapNodeConfig<Key, Item, IsLocal, IsEntity>
): MapNode<
	Record<TypeOfStrictInput<Key>, TypeOfStrictInput<Item>>,
	Record<TypeOfStrictOutput<Key>, TypeOfStrictOutput<Item>>,
	Record<TypeOfPartialInput<Key>, TypeOfPartialInput<Item>>,
	Record<TypeOfPartialOutput<Key>, TypeOfPartialOutput<Item>>,
	Key,
	Item,
	{},
	IsLocal,
	IsEntity
>
export function recordMap<
	Key extends AnyBaseNode,
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	config: DynamicMapNodeConfig<Key, Item, Variables, IsLocal, IsEntity>
): MapNode<
	Record<TypeOfStrictInput<Key>, TypeOfStrictInput<Item>>,
	Record<TypeOfStrictOutput<Key>, TypeOfStrictOutput<Item>>,
	Record<TypeOfPartialInput<Key>, TypeOfPartialInput<Item>>,
	Record<TypeOfPartialOutput<Key>, TypeOfPartialOutput<Item>>,
	Key,
	Item,
	Variables,
	IsLocal,
	IsEntity
>
export function recordMap<
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
): MapNode<
	Record<TypeOfStrictInput<Key>, TypeOfStrictInput<Item>>,
	Record<TypeOfStrictOutput<Key>, TypeOfStrictOutput<Item>>,
	Record<TypeOfPartialInput<Key>, TypeOfPartialInput<Item>>,
	Record<TypeOfPartialOutput<Key>, TypeOfPartialOutput<Item>>,
	Key,
	Item,
	Variables,
	IsLocal,
	IsEntity
> {
	return map(Object.entries as any, Object.fromEntries as any, key, item, config as any) as any
}