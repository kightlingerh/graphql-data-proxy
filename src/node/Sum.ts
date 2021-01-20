import { Option } from 'fp-ts/Option'
import { fromSum, Model } from '../model/Model'
import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	useAdjustedModel,
	hasDecodingTransformations,
	hasEncodingTransformations,
	Intersection,
	ModifyOutputIfLocal,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfCacheEntry,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	Ref,
	ModifyCacheEntryIfEntity
} from './shared'
import { BaseTypeNode, ExtractTypeName, type } from './Type'

type SumTypeNode = BaseTypeNode<any, any, any, any>

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

export interface SumNode<
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
		ModifyCacheEntryIfEntity<IsEntity, ExtractTypeOfSumNode<MS>, ExtractSumNodeCacheEntry<MS>>,
		Variables,
		ExtractSumNodeSubVariablesDefinition<MS>
	> {
	readonly tag: 'Sum'
	readonly members: MS
	readonly membersRecord: Record<ExtractTypeName<{ [K in keyof MS]: MS[K] }[number]>, MS[number]>
	readonly __customCache?: CustomCache<
		ExtractTypeOfPartialSumNode<MS>,
		ExtractNodeDefinitionType<ExtractSumNodeSubVariablesDefinition<MS> & Variables>,
		ModifyCacheEntryIfEntity<IsEntity, ExtractTypeOfSumNode<MS>, ExtractSumNodeCacheEntry<MS>>
	>
}

export interface StaticSumNodeConfig<
	MS extends ReadonlyArray<SumTypeNode>,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends StaticNodeConfig<
		ExtractTypeOfPartialSumNode<MS>,
		ModifyCacheEntryIfEntity<IsEntity, ExtractTypeOfSumNode<MS>, ExtractSumNodeCacheEntry<MS>>,
		{},
		IsLocal
	> {}

export interface DynamicSumNodeConfig<
	MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		ExtractTypeOfPartialSumNode<MS>,
		ModifyCacheEntryIfEntity<IsEntity, ExtractTypeOfSumNode<MS>, ExtractSumNodeCacheEntry<MS>>,
		{},
		IsLocal
	> {}

const SUM_TAG = 'Sum'

function getSumMemberModelRecord(members: ReadonlyArray<SumTypeNode>, isStrict: boolean) {
	const x: any = Object.create(null)
	members.forEach((member) => {
		x[member.__typename] = isStrict ? member.strict : member.partial
	})
	return x
}

function getSumMemberRecord(members: ReadonlyArray<SumTypeNode>) {
	const x: any = Object.create(null)
	members.forEach((member) => {
		x[member.__typename] = member
	})
	return x
}

function getSumMemberModel(
	isStrict: boolean,
	members: ReadonlyArray<SumTypeNode>,
	isLocal: boolean,
	useIdEncoder: boolean,
	useIdDecoder: boolean
): Model<any, any, any> {
	return useAdjustedModel(
		fromSum('__typename')(getSumMemberModelRecord(members, isStrict)),
		isLocal,
		useIdEncoder,
		useIdDecoder
	)
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

export function sum<
	MS extends ReadonlyArray<SumTypeNode>,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(ms: MS, config?: StaticSumNodeConfig<MS, IsLocal, IsEntity>): SumNode<MS, {}, IsLocal, IsEntity>

export function sum<
	MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(ms: MS, config: DynamicSumNodeConfig<MS, Variables, IsLocal, IsEntity>): SumNode<MS, Variables, IsLocal, IsEntity>
export function sum<
	MS extends ReadonlyArray<SumTypeNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	ms: MS,
	config?: StaticSumNodeConfig<MS, IsLocal, IsEntity> | DynamicSumNodeConfig<MS, Variables, IsLocal, IsEntity>
): any {
	const newMembers = addTypenameToMembers(ms)
	const membersRecord = getSumMemberRecord(ms)
	const useIdDecoder = !hasDecodingTransformations(membersRecord)
	const useIdEncoder = !hasEncodingTransformations(membersRecord)
	return {
		tag: SUM_TAG,
		members: newMembers,
		membersRecord,
		strict: getSumMemberModel(true, newMembers, !!config?.isLocal, useIdEncoder, useIdDecoder),
		partial: getSumMemberModel(false, newMembers, !!config?.isLocal, useIdEncoder, useIdDecoder),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: {
			encoding: !useIdEncoder,
			decoding: !useIdDecoder
		},
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}