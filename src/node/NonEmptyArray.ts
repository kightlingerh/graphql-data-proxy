import { Option } from 'fp-ts/lib/Option';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import {
	BaseNode,
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
	Ref,
	TypeOfCacheEntry,
	ModifyIfEntity,
	TypeOfRefs,
	PrimitiveNodeOptions
} from './shared';

export class NonEmptyArrayNode<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends BaseNode<
	Array<TypeOfStrictInput<Item>>,
	ModifyOutputIfLocal<IsLocal, NonEmptyArray<TypeOfStrictOutput<Item>>>,
	NonEmptyArray<TypeOf<Item>>,
	NonEmptyArray<TypeOfPartialInput<Item>>,
	ModifyOutputIfLocal<IsLocal, NonEmptyArray<TypeOfPartialOutput<Item>>>,
	NonEmptyArray<TypeOfPartial<Item>>,
	ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfCacheEntry<Item>>>>>,
	Variables,
	ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>,
	ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfRefs<Item>>>>>
> {
	readonly tag = 'NonEmptyArray';
	constructor(readonly item: Item, readonly options?: PrimitiveNodeOptions<Variables, IsLocal, IsEntity>) {
		super(options?.variables);
	}
}

export function nonEmptyArray<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(item: Item, options?: PrimitiveNodeOptions<Variables, IsLocal, IsEntity>): NonEmptyArrayNode<Item, Variables, IsLocal, IsEntity> {
	return new NonEmptyArrayNode(item, options);
}

export function markNonEmptyArrayAsEntity<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(node: NonEmptyArrayNode<Item, Variables, IsLocal, IsEntity>): NonEmptyArrayNode<Item, Variables, IsLocal, true> {
	return new NonEmptyArrayNode(node.item, { ...node.options, isEntity: true });
}
