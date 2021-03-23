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
	NodeOptions, TypeOfStrictInput, TypeOfStrictOutput, TypeOfPartialInput, TypeOfPartialOutput
} from './shared';

export interface MapNodeOptions<Key extends AnyNode, Item extends AnyNode, Variables extends NodeVariables, IsLocal extends boolean, IsEntity extends boolean>
	extends NodeOptions<Map<TypeOf<Key>, TypeOfPartial<Item>>, Variables, IsLocal, IsEntity> {
	readonly __typename?: string;
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
	constructor(readonly key: Key, readonly item: Item, readonly options?: MapNodeOptions<Key, Item, Variables, IsLocal, IsEntity>) {
		super(options?.variables);
		this.__typename = options?.__typename
	}
}

export function map<
	Key extends AnyNode,
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	options?: MapNodeOptions<Key, Item, Variables, IsLocal, IsEntity>
): MapNode<Key, Item, Variables, IsLocal, IsEntity> {
	return new MapNode(key, item, options);
}
