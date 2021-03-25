import {
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	ModifyOutputIfLocal,
	AnyNode,
	NodeVariables,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	TypeOfCacheEntry,
	ModifyIfEntity,
	TypeOfRefs,
	BaseNode,
	BaseNodeOptions, DynamicNodeOptions

} from './shared';

export class ArrayNode<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends BaseNode<
	Array<TypeOfStrictInput<Item>>,
	ModifyOutputIfLocal<IsLocal, Array<TypeOfStrictOutput<Item>>>,
	Array<TypeOf<Item>>,
	Array<TypeOfPartialInput<Item>>,
	ModifyOutputIfLocal<IsLocal, Array<TypeOfPartialOutput<Item>>>,
	Array<TypeOfPartial<Item>>,
	ModifyIfEntity<IsEntity, Array<TypeOf<Item>>, Array<TypeOfCacheEntry<Item>>>,
	Variables,
	ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>,
	ModifyIfEntity<IsEntity, Array<TypeOf<Item>>, Array<TypeOfRefs<Item>>>
> {
	readonly tag = 'Array';
	constructor(readonly item: Item, readonly options?: BaseNodeOptions<IsLocal, IsEntity, Variables>) {
		super(options?.variables);
	}
}

export function array<
	Item extends AnyNode,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
	>(item: Item, options?: BaseNodeOptions<IsLocal, IsEntity>): ArrayNode<Item, {}, IsLocal, IsEntity>
export function array<
	Item extends AnyNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
	>(item: Item, options: DynamicNodeOptions<Variables, IsLocal, IsEntity>): ArrayNode<Item, Variables, IsLocal, IsEntity>
export function array<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(item: Item, options?: BaseNodeOptions<IsLocal, IsEntity, Variables>): ArrayNode<Item, Variables, IsLocal, IsEntity> {
	return new ArrayNode<Item, Variables, IsLocal, IsEntity>(item, options);
}

export function markArrayAsEntity<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(node: ArrayNode<Item, Variables, IsLocal, IsEntity>): ArrayNode<Item, Variables, IsLocal, true> {
	return new ArrayNode(node.item, { ...node.options, isEntity: true });
}

