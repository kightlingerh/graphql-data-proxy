import { literal, Model, fromType, fromPartial, eqById as eqByIdModel, useEncoder } from '../model/Model'
import { scalar, ScalarNode } from './Scalar'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	extractPartialModels,
	extractStrictModels,
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
	ModifyIfEntity,
	TypeOfRefs,
	CustomCache
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

export type ExtractTypeNodeRefsFromMembers<MS extends Record<string, AnyBaseNode>> = {
	[K in keyof MS]: TypeOfRefs<MS[K]>
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
		ModifyIfEntity<IsEntity, ExtractTypeNodeStrictDataFromMembers<MS>, ExtractTypeNodeCacheEntryFromMembers<MS>>,
		Variables,
		ExtractTypeNodeSubVariablesFromMembers<MS>,
		ModifyIfEntity<IsEntity, ExtractTypeNodeStrictDataFromMembers<MS>, ExtractTypeNodeRefsFromMembers<MS>>
	> {
	readonly __typename: Typename
	readonly tag: 'Type'
	readonly members: MS
	readonly __customCache?: CustomCache<
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS> & Variables>
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
> extends StaticNodeConfig<IsLocal, IsEntity> {
	includeTypename?: IncludeTypename
	useCustomCache?: CustomCache<
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS>>
	>
}

export interface DynamicTypeNodeConfig<
	MS extends Record<string, AnyBaseNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IncludeTypename extends boolean,
	IsEntity extends boolean
> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {
	includeTypename?: IncludeTypename
	useCustomCache?: CustomCache<
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS>>
	>
}

export const TYPE_TAG = 'Type'

function useTypeMemberModel(
	strict: boolean,
	members: Record<string, AnyBaseNode>,
	isLocal: boolean,
	useIdEncoder: boolean,
	useIdDecoder: boolean
): Model<any, any, any> {
	return useAdjustedModel(
		strict ? fromType(extractStrictModels(members)) : fromPartial(extractPartialModels(members)),
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
		strict: useTypeMemberModel(true, members, !!config?.isLocal, useIdEncoder, useIdDecoder),
		partial: useTypeMemberModel(false, members, !!config?.isLocal, useIdEncoder, useIdDecoder),
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

export function pickFromType<T extends TypeNode<any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	keys: P[]
): TypeNode<ExtractTypeName<T>, Pick<T['members'], P>, T['variables']> {
	const n: any = {}
	keys.forEach((k) => {
		n[k] = node.members[k]
	})
	return type(node.__typename, n, node.variables) as any
}

export function omitFromType<T extends TypeNode<any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	keys: P[]
): TypeNode<ExtractTypeName<T>, Omit<T['members'], P>, T['variables']> {
	const n: any = {}
	keys.forEach((k) => {
		if (!keys.includes(k)) {
			n[k] = node.members[k]
		}
	})
	return type(node.__typename, n, node.variables) as any
}

export function eqById<T extends TypeNode<any, Record<'id', AnyBaseNode>, any, any, any>>(node: T): T {
	return {
		...node,
		strict: eqByIdModel(node.strict as any)
	}
}

export function encodeById<
	Typename extends string,
	MS extends {
		id: AnyBaseNode
		[K: string]: AnyBaseNode
	},
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false,
	IsEntity extends boolean = false
>(
	node: TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename, IsEntity>
): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename, IsEntity> {
	return {
		...node,
		strict: useEncoder(node.strict as any)({
			encode: (a) => node.members.id.strict.encode((a as any).id)
		})
	}
}

export function markTypeAsEntity<T extends BaseTypeNode<any, any, any, any, any>>(
	node: T
): BaseTypeNode<T['__typename'], T['members'], T['variables'], Exclude<T['__isLocal'], undefined>, true> {
	return {
		...node,
		__isEntity: true
	} as any
}
