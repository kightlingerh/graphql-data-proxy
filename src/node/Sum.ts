import { Option } from 'fp-ts/lib/Option';
import {
	BaseNode,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	Intersection,
	ModifyOutputIfLocal,
	NodeVariables,
	TypeOf,
	TypeOfCacheEntry,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	Ref,
	ModifyIfEntity,
	TypeOfRefs,
	PrimitiveNodeOptions, ExtractIsLocal, ExtractIsEntity
} from './shared';
import { ExtractTypeName, ExtractTypeNodeMembers, type, TypeNode } from './Type';

type SumTypeNode = TypeNode<any, any, any, any, any, any>;

type ExtractSumNodeMembers<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeNode<
		ExtractTypeName<MS[K]>,
		ExtractTypeNodeMembers<MS[K]>,
		ExtractVariablesDefinition<MS[K]>,
		ExtractIsLocal<MS[K]>,
		ExtractIsEntity<MS[K]>
	>;
};

type ExtractTypeOfSumNodeStrictInput<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfStrictInput<MS[K]> & { __typename: ExtractTypeName<MS[K]> };
}[number];

type ExtractTypeOfSumNodeStrictOutput<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfStrictOutput<MS[K]> & { __typename: ExtractTypeName<MS[K]> };
}[number];

type ExtractTypeOfSumNode<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOf<MS[K]> & { __typename: ExtractTypeName<MS[K]> };
}[number];

type ExtractTypeOfPartialSumNode<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfPartial<MS[K]> & { __typename?: ExtractTypeName<MS[K]> };
}[number];

type ExtractTypeOfSumNodePartialInput<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfPartialInput<MS[K]> & { __typename?: ExtractTypeName<MS[K]> };
}[number];

type ExtractTypeOfSumNodePartialOutput<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfPartialOutput<MS[K]> & { __typename?: ExtractTypeName<MS[K]> };
}[number];

export type ExtractSumNodeCacheEntry<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: Ref<Option<[ExtractTypeName<MS[K]>, TypeOfCacheEntry<MS[K]>]>>;
}[number];

export type ExtractSumNodeSubVariablesDefinition<MS extends ReadonlyArray<SumTypeNode>> = {} & Intersection<
	{
		[K in keyof MS]: ExtractSubVariablesDefinition<MS[K]> & ExtractVariablesDefinition<MS[K]>;
	}[number]
>;

export type ExtractSumNodeRefs<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: Ref<Option<TypeOfRefs<MS[K]>>>;
}[number];

export type SumNodeOptions<MS extends ReadonlyArray<SumTypeNode>, Variables extends NodeVariables = {}> = PrimitiveNodeOptions<
	ExtractTypeOfPartialSumNode<MS>,
	Variables
>;

function useSumMemberRecord(members: ReadonlyArray<SumTypeNode>) {
	const x: any = {};
	members.forEach((member) => {
		x[member.__typename] = member;
	});
	return x;
}

function addTypenameToMembers<MS extends ReadonlyArray<SumTypeNode>>(members: MS): ExtractSumNodeMembers<MS> {
	return members.map((member) =>
		member.members.hasOwnProperty('__typename')
			? member
			: type(member.__typename, member.members, {
					variables: member.variables,
					includeTypename: true
			  })
	) as any;
}

export class SumNode<
	MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends BaseNode<
	ExtractTypeOfSumNodeStrictInput<MS>,
	ModifyOutputIfLocal<IsLocal, ExtractTypeOfSumNodeStrictOutput<MS>>,
	ExtractTypeOfSumNode<MS>,
	ExtractTypeOfSumNodePartialInput<MS>,
	ModifyOutputIfLocal<IsLocal, ExtractTypeOfSumNodePartialOutput<MS>>,
	ExtractTypeOfPartialSumNode<MS>,
	ModifyIfEntity<IsEntity, ExtractTypeOfSumNode<MS>, ExtractSumNodeCacheEntry<MS>>,
	Variables,
	ExtractSumNodeSubVariablesDefinition<MS>,
	ModifyIfEntity<IsEntity, ExtractTypeOfSumNode<MS>, ExtractSumNodeRefs<MS>>
> {
	readonly tag = 'Sum';
	readonly members: ExtractSumNodeMembers<MS>;
	readonly membersRecord: Record<ExtractTypeName<{ [K in keyof ExtractSumNodeMembers<MS>]: ExtractSumNodeMembers<MS>[K] }[number]>, ExtractSumNodeMembers<MS>[number]>;
	constructor(members: MS, options?: SumNodeOptions<MS, Variables>) {
		super(options);
		this.members = addTypenameToMembers(members);
		this.membersRecord = useSumMemberRecord(this.members);
	}
}

export function sum<
	MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(members: MS, options?: SumNodeOptions<MS, Variables>): SumNode<MS, Variables, IsLocal, IsEntity> {
	return new SumNode(members, options)
}

export function markSumAsEntity<MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false>(
	node: SumNode<MS, Variables, IsLocal, IsEntity>
): SumNode<MS, Variables, IsLocal, true> {
	return new SumNode<MS, Variables, IsLocal, true>(node.members as MS, {...node.options, isEntity: true})
}
