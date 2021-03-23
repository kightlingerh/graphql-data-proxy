import {
	BaseNode,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	ModifyOutputIfLocal,
	AnyNode,
	NodeVariables,
	NodeOptions,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	TypeOfCacheEntry,
	ModifyIfEntity,
	TypeOfRefs,
	_HasEncodingTransformations,
	_HasDecodingTransformations
} from './shared';

export type MutationNodeOptions<Result extends AnyNode, Variables extends NodeVariables = {}> = NodeOptions<
	TypeOfPartial<Result>,
	Variables
>;

export class MutationNode<
	Result extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends BaseNode<
	TypeOfStrictInput<Result>,
	ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Result>>,
	TypeOf<Result>,
	TypeOfPartialInput<Result>,
	ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Result>>,
	TypeOfPartial<Result>,
	ModifyIfEntity<IsEntity, TypeOf<Result>, TypeOfCacheEntry<Result>>,
	Variables,
	ExtractSubVariablesDefinition<Result> & ExtractVariablesDefinition<Result>,
	ModifyIfEntity<IsEntity, TypeOf<Result>, TypeOfRefs<Result>>
> {
	readonly tag = 'Mutation';
	readonly [_HasDecodingTransformations]: boolean;
	readonly [_HasEncodingTransformations]: boolean;
	constructor(readonly result: Result, options?: MutationNodeOptions<Result, Variables>) {
		super(options);
		this[_HasDecodingTransformations] = result[_HasDecodingTransformations];
		this[_HasEncodingTransformations] = result[_HasEncodingTransformations];
	}
}

export function mutation<
	Item extends AnyNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(result: Item, options?: MutationNodeOptions<Item, Variables>): MutationNode<Item, Variables, IsLocal, IsEntity> {
	return new MutationNode(result, options);
}
