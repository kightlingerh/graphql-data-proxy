import { Option } from 'fp-ts/lib/Option'
import {
	BaseNode,
	EMPTY_VARIABLES,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	hasDecodingTransformations,
	hasEncodingTransformations,
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
	TypeOfRefs, AnyNode, NodeOptions
} from './shared';
import { ExtractTypeName, type, TypeNode } from './Type';

type SumTypeNode = TypeNode<any, any, any, any, any, any>

type ExtractSumNodeMembers<MS extends [SumTypeNode, ...SumTypeNode[]]> = {
	[K in keyof MS]: TypeNode<ExtractTypeName<MS[K]>, any, any, any, any, any>
}[number]

type ExtractTypeOfSumNodeStrictInput<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfStrictInput<MS[K]> & { __typename: ExtractTypeName<MS[K]> }
}[number]

type ExtractTypeOfSumNodeStrictOutput<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfStrictOutput<MS[K]> & { __typename: ExtractTypeName<MS[K]> }
}[number]

type ExtractTypeOfSumNode<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOf<MS[K]> & { __typename: ExtractTypeName<MS[K]> }
}[number]

type ExtractTypeOfPartialSumNode<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfPartial<MS[K]> & { __typename?: ExtractTypeName<MS[K]> }
}[number]

type ExtractTypeOfSumNodePartialInput<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfPartialInput<MS[K]> & { __typename?: ExtractTypeName<MS[K]> }
}[number]

type ExtractTypeOfSumNodePartialOutput<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: TypeOfPartialOutput<MS[K]> & { __typename?: ExtractTypeName<MS[K]> }
}[number]

export type ExtractSumNodeCacheEntry<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: Ref<Option<[ExtractTypeName<MS[K]>, TypeOfCacheEntry<MS[K]>]>>
}[number]

export type ExtractSumNodeSubVariablesDefinition<MS extends ReadonlyArray<SumTypeNode>> = {} & Intersection<
	{
		[K in keyof MS]: ExtractSubVariablesDefinition<MS[K]> & ExtractVariablesDefinition<MS[K]>
	}[number]
>

export type ExtractSumNodeRefs<MS extends ReadonlyArray<SumTypeNode>> = {
	[K in keyof MS]: Ref<Option<TypeOfRefs<MS[K]>>>
}[number]

export type SumNodeOptions<MS extends ReadonlyArray<SumTypeNode>, Variables extends NodeVariables = {}> = NodeOptions<
	ExtractTypeOfPartialSumNode<MS>,
	Variables
	>;

function useSumMemberRecord(members: ReadonlyArray<SumTypeNode>) {
	const x: any = {}
	members.forEach((member) => {
		x[member.__typename] = member
	})
	return x
}

function addTypenameToMembers<MS extends ReadonlyArray<SumTypeNode>>(members: MS) {
	return members.map((member) =>
		member.members.hasOwnProperty('__typename')
			? member
			: type(member.__typename, member.members, {
				variables: member.variables,
				includeTypename: true
			})
	)
}

export class SumNode<
	MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
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
	readonly tag = 'Sum'
	readonly membersRecord: Record<ExtractTypeName<{ [K in keyof MS]: MS[K] }[number]>, MS[number]> &
	constructor(members: MS, options?: SumNodeOptions<MS,  Variables>) {
		super(options)
		const newMembers = addTypenameToMembers(ms)
		const membersRecord = useSumMemberRecord(newMembers)
	}
}





export function sum<
	MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(ms: MS, config: DynamicSumNodeConfig<Variables, IsLocal, IsEntity>): SumNode<MS, Variables, IsLocal, IsEntity>
export function sum<
	MS extends ReadonlyArray<SumTypeNode>,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(ms: MS, config?: StaticSumNodeConfig<IsLocal, IsEntity>): SumNode<MS, {}, IsLocal, IsEntity>

export function sum<
	MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(ms: MS, config?: StaticSumNodeConfig<IsLocal, IsEntity> | DynamicSumNodeConfig<Variables, IsLocal, IsEntity>): any {
	const newMembers = addTypenameToMembers(ms)
	const membersRecord = useSumMemberRecord(newMembers)
	return {
		tag: SUM_TAG,
		members: newMembers,
		membersRecord,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasDecodingTransformations: hasDecodingTransformations(membersRecord),
		__hasEncodingTransformations: hasEncodingTransformations(membersRecord),
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export function markSumAsEntity<T extends SumNode<any, any, any, any>>(
	node: T
): SumNode<T['members'], T['variables'], Exclude<T['__isLocal'], undefined>, true> {
	return {
		...node,
		__isEntity: true
	} as any
}
