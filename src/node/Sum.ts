import * as M from '../model/Model';
import {scalar} from './Scalar';
import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	getModel,
	Intersection,
	ModifyOutputIfLocal,
	Node,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfCacheEntry,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput
} from './shared';
import {
	DynamicTypeNodeConfig,
	ExtractTypeName,
	getTypeMemberPartialModel,
	getTypeMemberStrictModel,
	hasDecodingTransformations,
	hasEncodingTransformations,
	StaticTypeNodeConfig,
	TYPE_TAG,
	TypeNode
} from './Type';

type SumNodeTypeOfStrictInput<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>> = { [K in keyof MS]: TypeOfStrictInput<MS[K]> }[number]
type SumNodeTypeOfStrictOutput<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>> = { [K in keyof MS]: TypeOfStrictOutput<MS[K]> }[number]
type SumNodeTypeOf<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>> = { [K in keyof MS]: TypeOf<MS[K]> }[number]
type SumNodeTypeOfPartial<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>> = {
	[K in keyof MS]: TypeOfPartial<MS[K]>
}[number]
type SumNodeTypeOfPartialInput<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>> = { [K in keyof MS]: TypeOfPartialInput<MS[K]> }[number]
type SumNodeTypeOfPartialOutput<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>> = { [K in keyof MS]: TypeOfPartialOutput<MS[K]> }[number]
export type SumNodeCacheEntry<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>> =
	{ [K in keyof MS]: TypeOfCacheEntry<MS[K]> }[number]
	| undefined
export type SumNodeSubVariablesDefinition<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>> =
	{}
	& Intersection<{
	[K in keyof MS]: ExtractSubVariablesDefinition<MS[K]> & ExtractVariablesDefinition<MS[K]>
}[number]>

interface SumNode<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false>
	extends BaseNode<SumNodeTypeOfStrictInput<MS>,
		ModifyOutputIfLocal<IsLocal, SumNodeTypeOfStrictOutput<MS>>,
		SumNodeTypeOf<MS>,
		SumNodeTypeOfPartialInput<MS>,
		ModifyOutputIfLocal<IsLocal, SumNodeTypeOfPartialOutput<MS>>,
		SumNodeTypeOfPartial<MS>,
		SumNodeCacheEntry<MS>,
		Variables,
		SumNodeSubVariablesDefinition<MS>> {
	readonly tag: 'Sum'
	readonly members: MS
	readonly membersRecord: Record<ExtractTypeName<{ [K in keyof MS]: MS[K] }[number]>, MS[number]>
	readonly __customCache?: CustomCache<SumNodeTypeOfPartial<MS>,
		ExtractNodeDefinitionType<SumNodeSubVariablesDefinition<MS> & Variables>,
		SumNodeTypeOfPartialInput<MS> | undefined>
}

export interface StaticSumNodeConfig<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>,
	IsLocal extends boolean,
	IncludeTypename extends boolean>
	extends StaticNodeConfig<SumNodeTypeOfPartial<MS>,
		SumNodeTypeOfPartialInput<MS> | undefined,
		{},
		IsLocal> {
	includeTypename?: IncludeTypename
}

export interface DynamicSumNodeConfig<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	>
	extends DynamicNodeConfig<Variables,
		SumNodeTypeOfPartial<MS>,
		SumNodeTypeOfPartialInput<MS> | undefined, ,
		{},
		IsLocal> {
}

const SUM_TAG = 'Sum'

function getSumMemberModelRecord(members: ReadonlyArray<TypeNode<any, any, any, any, true>>, isStrict: boolean) {
	const x: any = {};
	members.forEach(member => {
		x[member.__typename] = isStrict ? member.strict : member.partial
	});
	return x;
}

function getSumMemberModel(
	isStrict: boolean,
	members: ReadonlyArray<TypeNode<any, any, any, any, true>>,
	isLocal: boolean,
	useIdEncoder: boolean,
	useIdDecoder: boolean
): M.Model<any, any, any> {
	return getModel(
		M.fromSum('__typename')(getSumMemberModelRecord(members, isStrict)),
		isLocal,
		useIdEncoder,
		useIdDecoder
	)
}

export function sum<MS extends ReadonlyArray<TypeNode<any, any, any, any, true>>,
	IsLocal extends boolean = false,
	>(
	ms: MS,
	config?: StaticSumNodeConfig<MS, IsLocal>
): TypeNode<Typename, MS, {}, IsLocal, IncludeTypename>

export function type<Typename extends string,
	MS extends Record<string, Node>,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false>(
	__typename: Typename,
	ms: MS,
	config: DynamicTypeNodeConfig<MS, Variables, IsLocal, IncludeTypename>
): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename>
export function type<Typename extends string,
	MS extends Record<string, Node>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false>(
	__typename: Typename,
	ms: MS,
	config?:
		| StaticTypeNodeConfig<MS, IsLocal, IncludeTypename>
		| DynamicTypeNodeConfig<MS, Variables, IsLocal, IncludeTypename>
): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename> {
	const members = config?.includeTypename ? {...ms, __typename: scalar(__typename, M.literal(__typename))} : ms
	const useIdDecoder = !hasDecodingTransformations(ms)
	const useIdEncoder = !hasEncodingTransformations(ms)
	return {
		tag: TYPE_TAG,
		__typename,
		members,
		strict: getTypeMemberStrictModel(members, !!config?.isLocal, useIdEncoder, useIdDecoder),
		partial: getTypeMemberPartialModel(members, !!config?.isLocal, useIdEncoder, useIdDecoder),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: {
			encoding: !useIdEncoder,
			decoding: !useIdDecoder
		},
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	} as any
}
