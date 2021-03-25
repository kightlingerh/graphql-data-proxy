import {
	BaseNode,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	ModifyOutputIfLocal,
	AnyNode,
	NodeVariables,
	TypeOf,
	TypeOfPartial,
	TypeOfCacheEntry,
	ModifyIfEntity,
	TypeOfRefs,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	BaseNodeOptions,
	ToId,
	DynamicNodeOptions
} from './shared';

export interface StaticMapNodeOptions<
	Key extends AnyNode,
	Item extends AnyNode,
	IsLocal extends boolean,
	IsEntity extends boolean,
	Variables extends NodeVariables = {}
> extends BaseNodeOptions<IsLocal, IsEntity, Variables> {
	readonly __typename?: string;
	readonly toId?: ToId<Map<TypeOf<Key>, TypeOfPartial<Item>>, Variables>;
}

export interface DynamicMapNodeOptions<
	Key extends AnyNode,
	Item extends AnyNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
> extends DynamicNodeOptions<Variables, IsLocal, IsEntity> {
	readonly __typename?: string;
	readonly toId?: ToId<Map<TypeOf<Key>, TypeOfPartial<Item>>, Variables>;
}

export class MapNode<
	Key extends AnyNode,
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false,
	StrictInput = Record<string, TypeOfStrictInput<Item>>,
	StrictOutput = Record<string, TypeOfStrictOutput<Item>>,
	PartialInput = Record<string, TypeOfPartialInput<Item>>,
	PartialOutput = Record<string, TypeOfPartialOutput<Item>>
> extends BaseNode<
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
	readonly tag = 'Map';
	// for array of object encodings
	readonly __typename?: string;
	constructor(
		readonly key: Key,
		readonly item: Item,
		readonly options?:
			| StaticMapNodeOptions<Key, Item, IsLocal, IsEntity, Variables>
			| DynamicMapNodeOptions<Key, Item, Variables, IsLocal, IsEntity>
	) {
		super(options?.variables);
		this.__typename = options?.__typename;
	}
}

export function map<
	Key extends AnyNode,
	Item extends AnyNode,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	options?: StaticMapNodeOptions<Key, Item, IsLocal, IsEntity>
): MapNode<Key, Item, {}, IsLocal, IsEntity>;
export function map<
	Key extends AnyNode,
	Item extends AnyNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	options: DynamicMapNodeOptions<Key, Item, Variables, IsLocal, IsEntity>
): MapNode<Key, Item, Variables, IsLocal, IsEntity>;
export function map<
	Key extends AnyNode,
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	options?:
		| StaticMapNodeOptions<Key, Item, IsLocal, IsEntity, Variables>
		| DynamicMapNodeOptions<Key, Item, Variables, IsLocal, IsEntity>
): MapNode<Key, Item, Variables, IsLocal, IsEntity> {
	return new MapNode(key, item, options);
}
