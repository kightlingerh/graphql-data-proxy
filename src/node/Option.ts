import { Option } from 'fp-ts/lib/Option';
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
	Ref,
	ModifyIfEntity,
	TypeOfRefs,
	BaseNode,
	NodeOptions,
	_HasDecodingTransformations
} from './shared';

export type OptionNodeOptions<Item extends AnyNode, Variables extends NodeVariables = {}> = NodeOptions<
	Option<TypeOfPartial<Item>>,
	Variables
>;

export class OptionNode<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends BaseNode<
	TypeOfStrictInput<Item> | null | undefined,
	ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Item> | null>,
	Option<TypeOf<Item>>,
	TypeOfPartialInput<Item> | null | undefined,
	ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Item> | null>,
	Option<TypeOfPartial<Item>>,
	ModifyIfEntity<IsEntity, Option<TypeOf<Item>>, Ref<Option<TypeOfCacheEntry<Item>>>>,
	Variables,
	ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>,
	ModifyIfEntity<IsEntity, Option<TypeOf<Item>>, Ref<Option<TypeOfRefs<Item>>>>
> {
	readonly tag = 'Option';
	readonly [_HasDecodingTransformations]: true;
	readonly [_HasDecodingTransformations]: true;
	constructor(readonly item: Item, options?: OptionNodeOptions<Item, Variables>) {
		super(options);
	}
}

export function option<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(item: Item, options?: OptionNodeOptions<Item, Variables>): OptionNode<Item, Variables, IsLocal, IsEntity> {
	return new OptionNode(item, options);
}

export function markOptionAsEntity<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(node: OptionNode<Item, Variables, IsLocal, IsEntity>): OptionNode<Item, Variables, IsLocal, true> {
	return new OptionNode(node.item, { ...node.options, isEntity: true });
}
