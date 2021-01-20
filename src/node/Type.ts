import * as M from '../model/Model'
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
	getModel,
	hasDecodingTransformations,
	hasEncodingTransformations,
	Intersection,
	ModifyOutputIfLocal,
	AnyBaseNode,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfCacheEntry,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	Values
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
	[K in keyof MS]: TypeOfCacheEntry<MS[K]>
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
	IsLocal extends boolean = false
>
	extends BaseNode<
		ExtractTypeNodeStrictInputFromMembers<MS>,
		ModifyOutputIfLocal<IsLocal, ExtractTypeNodeStrictOutputFromMembers<MS>>,
		ExtractTypeNodeStrictDataFromMembers<MS>,
		ExtractTypeNodePartialInputFromMembers<MS>,
		ModifyOutputIfLocal<IsLocal, ExtractTypeNodePartialOutputFromMembers<MS>>,
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractTypeNodeCacheEntryFromMembers<MS>,
		Variables,
		ExtractTypeNodeSubVariablesFromMembers<MS>
	> {
	readonly __typename: Typename
	readonly tag: 'Type'
	readonly members: MS
	readonly __customCache?: CustomCache<
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS> & Variables>,
		ExtractTypeNodePartialDataFromMembers<MS> | undefined
	>
}

export type TypeNode<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false
> = IncludeTypename extends true
	? BaseTypeNode<Typename, MS & { __typename: TypenameNode<Typename> }, Variables, IsLocal>
	: BaseTypeNode<Typename, MS, Variables, IsLocal>

export interface StaticTypeNodeConfig<
	MS extends Record<string, AnyBaseNode>,
	IsLocal extends boolean,
	IncludeTypename extends boolean
>
	extends StaticNodeConfig<
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractTypeNodeCacheEntryFromMembers<MS>,
		{},
		IsLocal
	> {
	includeTypename?: IncludeTypename
}

export interface DynamicTypeNodeConfig<
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IncludeTypename extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractTypeNodeCacheEntryFromMembers<MS>,
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
): M.Model<any, any, any> {
	return getModel(
		strict ? M.type(extractMemberStrictModels(members)) : M.type(extractMemberPartialModels(members)),
		isLocal,
		useIdEncoder,
		useIdDecoder
	)
}

export function type<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false
>(
	__typename: Typename,
	ms: MS,
	config?: StaticTypeNodeConfig<MS, IsLocal, IncludeTypename>
): TypeNode<Typename, MS, {}, IsLocal, IncludeTypename>
export function type<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false
>(
	__typename: Typename,
	ms: MS,
	config: DynamicTypeNodeConfig<MS, Variables, IsLocal, IncludeTypename>
): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename>
export function type<
	Typename extends string,
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false
>(
	__typename: Typename,
	ms: MS,
	config?:
		| StaticTypeNodeConfig<MS, IsLocal, IncludeTypename>
		| DynamicTypeNodeConfig<MS, Variables, IsLocal, IncludeTypename>
): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename> {
	const members = config?.includeTypename ? { ...ms, __typename: scalar(__typename, M.literal(__typename)) } : ms
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
