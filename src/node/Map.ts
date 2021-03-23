import {
	BaseNode,
	NodeOptions,
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
	_HasDecodingTransformations,
	_HasEncodingTransformations
} from './shared';

export type MapNodeOptions<
	Key extends AnyNode,
	Item extends AnyNode,
	Variables extends NodeVariables = {}
> = NodeOptions<Map<TypeOf<Key>, TypeOfPartial<Item>>, Variables> & { readonly __typename?: string };

export class MapNode<
	StrictInput,
	StrictOutput,
	PartialInput,
	PartialOutput,
	Key extends AnyNode,
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
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
	readonly [_HasDecodingTransformations]: boolean;
	readonly [_HasEncodingTransformations]: boolean;
	constructor(readonly key: Key, readonly item: Item, options?: MapNodeOptions<Key, Item, Variables>) {
		super(options);
		this.__typename = options?.__typename;
		this[_HasDecodingTransformations] = key[_HasDecodingTransformations] || item[_HasDecodingTransformations];
		this[_HasDecodingTransformations] = key[_HasDecodingTransformations] || item[_HasEncodingTransformations];
	}
}

export function map<
	StrictInput,
	StrictOutput,
	PartialInput,
	PartialOutput,
	Key extends AnyNode,
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	key: Key,
	item: Item,
	options?: MapNodeOptions<Key, Item, Variables>
): MapNode<StrictInput, StrictOutput, PartialInput, PartialOutput, Key, Item, Variables, IsLocal, IsEntity> {
	return new MapNode(key, item, options);
}
