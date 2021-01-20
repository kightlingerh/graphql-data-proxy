import { literal, Model, type as typeModel } from '../model/Model'
import { scalar, ScalarNode } from './Scalar'
import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	extractMemberPartialModels,
	extractMemberStrictModels,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	useAdjustedModel,
	hasDecodingTransformations,
	hasEncodingTransformations,
	Intersection,
	ModifyOutputIfLocal,
	AnyBaseNode,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	Values,
	CacheNode,
	ModifyCacheEntryIfEntity
} from './shared'

export type ExtractTypeName<T> = T extends { readonly __typename: infer A } ? A : never

export type ExtractTypeNodeStrictDataFromMembers<MS extends Record<string, AnyBaseNode>> = {
	[K in keyof MS]: TypeOf<MS[K]>
}

export type ExtractTypeNodeStrictInputFromMembers<MS extends Record<string, AnyBaseNode>> = {
	[K in keyof MS]: TypeOfStrictInput<MS[K]>
}
export type ExtractTypeNodeStrictOutputFromMembers<MS extends Record<string, AnyBaseNode>> = {
	[K in keyof MS]: TypeOfStrictOutput<MS[K]>
}
export type ExtractTypeNodePartialDataFromMembers<MS extends Record<string, AnyBaseNode>> = {
	[K in keyof MS]?: TypeOfPartial<MS[K]>
}
export type ExtractTypeNodePartialInputFromMembers<MS extends Record<string, AnyBaseNode>> = {
	[K in keyof MS]?: TypeOfPartialInput<MS[K]>
}
export type ExtractTypeNodePartialOutputFromMembers<MS extends Record<string, AnyBaseNode>> = {
	[K in keyof MS]?: TypeOfPartialOutput<MS[K]>
}
export type ExtractTypeNodeCacheEntryFromMembers<MS extends Record<string, AnyBaseNode>> = {
	[K in keyof MS]: CacheNode<MS[K]>
}
export type ExtractTypeNodeSubVariablesFromMembers<MS extends Record<string, AnyBaseNode>> = {} & Intersection<
	Values<
		{
			[K in keyof MS]: ExtractSubVariablesDefinition<MS[K]> & ExtractVariablesDefinition<MS[K]>
		}
	>
>

export interface TypenameNode<Name extends string> extends ScalarNode<Name, string, string, Name> {}

export interface BaseTypeNode<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		ExtractTypeNodeStrictInputFromMembers<MS>,
		ModifyOutputIfLocal<IsLocal, ExtractTypeNodeStrictOutputFromMembers<MS>>,
		ExtractTypeNodeStrictDataFromMembers<MS>,
		ExtractTypeNodePartialInputFromMembers<MS>,
		ModifyOutputIfLocal<IsLocal, ExtractTypeNodePartialOutputFromMembers<MS>>,
		ExtractTypeNodePartialDataFromMembers<MS>,
		ModifyCacheEntryIfEntity<
			IsEntity,
			ExtractTypeNodeStrictDataFromMembers<MS>,
			ExtractTypeNodeCacheEntryFromMembers<MS>
		>,
		Variables,
		ExtractTypeNodeSubVariablesFromMembers<MS>
	> {
	readonly __typename: Typename
	readonly tag: 'Type'
	readonly members: MS
	readonly __customCache?: CustomCache<
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS> & Variables>,
		ModifyCacheEntryIfEntity<
			IsEntity,
			ExtractTypeNodeStrictDataFromMembers<MS>,
			ExtractTypeNodeCacheEntryFromMembers<MS>
		>
	>
}

export type TypeNode<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false,
	IsEntity extends boolean = false
> = IncludeTypename extends true
	? BaseTypeNode<Typename, MS & { __typename: TypenameNode<Typename> }, Variables, IsLocal, IsEntity>
	: BaseTypeNode<Typename, MS, Variables, IsLocal, IsEntity>

export interface StaticTypeNodeConfig<
	MS extends Record<string, AnyBaseNode>,
	IsLocal extends boolean,
	IncludeTypename extends boolean,
	IsEntity extends boolean
>
	extends StaticNodeConfig<
		ExtractTypeNodePartialDataFromMembers<MS>,
		ModifyCacheEntryIfEntity<
			IsEntity,
			ExtractTypeNodeStrictDataFromMembers<MS>,
			ExtractTypeNodeCacheEntryFromMembers<MS>
		>,
		{},
		IsLocal
	> {
	includeTypename?: IncludeTypename
}

export interface DynamicTypeNodeConfig<
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IncludeTypename extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		ExtractTypeNodePartialDataFromMembers<MS>,
		ModifyCacheEntryIfEntity<
			IsEntity,
			ExtractTypeNodeStrictDataFromMembers<MS>,
			ExtractTypeNodeCacheEntryFromMembers<MS>
		>,
		{},
		IsLocal
	> {
	includeTypename?: IncludeTypename
}

export const TYPE_TAG = 'Type'

function getTypeMemberModel(
	strict: boolean,
	members: Record<string, AnyBaseNode>,
	isLocal: boolean,
	useIdEncoder: boolean,
	useIdDecoder: boolean
): Model<any, any, any> {
	return useAdjustedModel(
		strict ? typeModel(extractMemberStrictModels(members)) : typeModel(extractMemberPartialModels(members)),
		isLocal,
		useIdEncoder,
		useIdDecoder
	)
}

export function type<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false,
	IsEntity extends boolean = false
>(
	__typename: Typename,
	ms: MS,
	config?: StaticTypeNodeConfig<MS, IsLocal, IncludeTypename, IsEntity>
): TypeNode<Typename, MS, {}, IsLocal, IncludeTypename, IsEntity>
export function type<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false,
	IsEntity extends boolean = false
>(
	__typename: Typename,
	ms: MS,
	config: DynamicTypeNodeConfig<MS, Variables, IsLocal, IncludeTypename, IsEntity>
): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename, IsEntity>
export function type<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false,
	IsEntity extends boolean = false
>(
	__typename: Typename,
	ms: MS,
	config?:
		| StaticTypeNodeConfig<MS, IsLocal, IncludeTypename, IsEntity>
		| DynamicTypeNodeConfig<MS, Variables, IsLocal, IncludeTypename, IsEntity>
): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename, IsEntity> {
	const members = config?.includeTypename ? { ...ms, __typename: scalar(__typename, literal(__typename)) } : ms
	const useIdDecoder = !hasDecodingTransformations(ms)
	const useIdEncoder = !hasEncodingTransformations(ms)
	return {
		tag: TYPE_TAG,
		__typename,
		members,
		strict: getTypeMemberModel(true, members, !!config?.isLocal, useIdEncoder, useIdDecoder),
		partial: getTypeMemberModel(false, members, !!config?.isLocal, useIdEncoder, useIdDecoder),
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
