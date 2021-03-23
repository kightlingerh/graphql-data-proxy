import { Lazy } from 'fp-ts/lib/function';
import { literal } from '../model/Model'
import { Encoder } from '../model/Encoder'
import { Eq } from '../model/Eq'
import { scalar, ScalarNode } from './Scalar'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
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
			ModifyIfEntity<
				IsEntity,
				ExtractTypeNodeStrictDataFromMembers<MS>,
				ExtractTypeNodeCacheEntryFromMembers<MS>
			>,
			Variables,
			ExtractTypeNodeSubVariablesFromMembers<MS>,
			ModifyIfEntity<IsEntity, ExtractTypeNodeStrictDataFromMembers<MS>, ExtractTypeNodeRefsFromMembers<MS>>
		>,
		Partial<
			Encoder<
				ModifyOutputIfLocal<IsLocal, ExtractTypeNodeStrictOutputFromMembers<MS>>,
				ExtractTypeNodeStrictDataFromMembers<MS>
			>
		>,
		Partial<Eq<ExtractTypeNodeStrictDataFromMembers<MS>>> {
	readonly __typename: Typename
	readonly tag: 'Type'
	readonly members: MS
	readonly __print?: Lazy<string>
	readonly __customCache?: {
		readonly toId: CustomCache<
			ExtractTypeNodePartialDataFromMembers<MS>,
			ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS> & Variables>
			>
	}
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
	print?: Lazy<string>
	toId?: CustomCache<
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
	print?: Lazy<string>
	toId?: CustomCache<
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS>>
	>
}

export const TYPE_TAG = 'Type'

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
	return {
		tag: TYPE_TAG,
		__typename,
		members,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasEncodingTransformations: hasEncodingTransformations(members),
		__hasDecodingTransformations: hasDecodingTransformations(members),
		__print: config?.print,
		__customCache: config?.toId ? { toId: config.toId } : undefined,
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
	for (const k in node.members) {
		if (!keys.includes(k as P)) {
			n[k] = node.members[k]
		}
	}
	return type(node.__typename, n, node.variables) as any
}

export function markTypeAsEntity<T extends BaseTypeNode<any, any, any, any, any>>(
	node: T
): BaseTypeNode<T['__typename'], T['members'], T['variables'], Exclude<T['__isLocal'], undefined>, true> {
	return {
		...node,
		__isEntity: true
	} as any
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
		encode: (i: any) => i.id // this is currently unsafe but will work for literal types
	}
}

export function eqById<
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
		equals: (a: any, b: any) => a.id === b.id // this is currently unsafe but will work for literal types
	}
}
