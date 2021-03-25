import {
	BaseNode,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	AnyNode,
	NodeVariables,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	TypeOfCacheEntry,
	TypeOfRefs,
	BaseNodeOptions
} from './shared';

export class MutationNode<
	Result extends AnyNode,
	Variables extends NodeVariables = {}
> extends BaseNode<
	TypeOfStrictInput<Result>,
	TypeOfStrictOutput<Result>,
	TypeOf<Result>,
	TypeOfPartialInput<Result>,
	TypeOfPartialOutput<Result>,
	TypeOfPartial<Result>,
	TypeOfCacheEntry<Result>,
	Variables,
	ExtractSubVariablesDefinition<Result> & ExtractVariablesDefinition<Result>,
	TypeOfRefs<Result>
> {
	readonly tag = 'Mutation';
	constructor(readonly result: Result, readonly options?: BaseNodeOptions<false, false, Variables>) {
		super(options?.variables);
	}
}

export function mutation<
	Item extends AnyNode,
	Variables extends NodeVariables = {}
>(result: Item, options?: BaseNodeOptions<false, false, Variables>): MutationNode<Item, Variables> {
	return new MutationNode(result, options);
}
