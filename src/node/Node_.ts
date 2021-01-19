import { constUndefined } from 'fp-ts/lib/function'
import { Float, Int } from '../model/Guard'
import * as M from '../model/Model'
import { isEmptyObject } from '../shared/index'

type Node = BaseNode<any, any, any, any, any, any, any, any, any>

interface BaseNode<
	StrictInput,
	StrictOutput,
	StrictData,
	PartialInput,
	PartialOutput,
	PartialData,
	CacheEntry,
	Variables extends NodeVariables = {},
	SubVariables extends NodeVariables = {}
> {
	readonly tag: string
	readonly strict: M.Model<StrictInput, StrictOutput, StrictData>
	readonly partial: M.Model<PartialInput, PartialOutput, PartialData>
	readonly variables: Variables

	// for internal use
	readonly __hasTransformations: {
		readonly decoding: boolean
		readonly encoding: boolean
	}
	readonly __subVariables?: SubVariables
	readonly __isLocal?: boolean
	readonly __isEntity?: boolean
	readonly __cacheEntry?: CacheEntry
}

export type TypeOf<T> = T extends { readonly strict: M.Model<any, any, infer A> } ? A : never

export type TypeOfStrictInput<T> = T extends { readonly strict: M.Model<infer I, any, any> } ? I : never

export type TypeOfStrictOutput<T> = T extends { readonly strict: M.Model<any, infer O, any> } ? O : never

export type TypeOfPartial<T> = T extends { readonly partial: M.Model<any, any, infer A> } ? A : never

export type TypeOfPartialInput<T> = T extends { readonly partial: M.Model<infer I, any, any> } ? I : never

export type TypeOfPartialOutput<T> = T extends { readonly partial: M.Model<any, infer O, any> } ? O : never

export type ExtractVariablesDefinition<T> = T extends { readonly variables: Record<string, Node> }
	? T['variables']
	: never

export type ExtractNodeDefinitionType<T> = T extends Record<string, Node> ? { [K in keyof T]: TypeOf<T[K]> } : never;

export type TypeOfVariables<T> =  ExtractNodeDefinitionType<ExtractVariablesDefinition<T>>;

export type ExtractSubVariablesDefinition<T> = T extends { readonly __subVariables?: Record<string, Node> }
	? Exclude<T['__subVariables'], undefined>
	: never

export type TypeOfSubVariables<T> = ExtractNodeDefinitionType<ExtractSubVariablesDefinition<T>>

export type TypeOfCacheEntry<T> = T extends { readonly __cacheEntry?: infer A }
	? Exclude<A, undefined>
	: never

export type TypeOfMergedVariables<T> = TypeOfSubVariables<T> & TypeOfVariables<T>

export interface StaticNodeConfig<
	PartialData,
	CacheEntry,
	MergedVariables extends NodeVariables = {},
	IsLocal extends boolean = false
> {
	readonly variables?: Record<string, Node>
	readonly isLocal?: IsLocal
	readonly isEntity?: boolean
	readonly useCustomCache?: CustomCache<
		PartialData,
		{ [K in keyof MergedVariables]: TypeOf<MergedVariables[K]> },
		CacheEntry
	>
}

export interface DynamicNodeConfig<
	Variables extends NodeVariables,
	PartialData,
	CacheEntry,
	SubVariables extends NodeVariables = {},
	IsLocal extends boolean = false
> extends StaticNodeConfig<PartialData, CacheEntry, SubVariables & Variables, IsLocal> {
	readonly variables: Variables
}

export type NodeVariables = Record<string, Node>

export type Path = Array<string | number>

export interface CustomCache<PartialData, Variables, CacheEntry> {
	(path: Path, variables: Variables, data?: PartialData): CacheEntry | undefined | null
}

export const EMPTY_VARIABLES: any = {}
export const EMPTY_VARIABLES_MODEL = M.type({})

function extractMemberStrictModels<MS extends Record<string, Node>>(members: MS): { [K in keyof MS]: MS[K]['strict'] } {
	const x: any = Object.create(null)
	for (const key in members) {
		x[key as keyof MS] = members[key as keyof MS].strict
	}
	return x
}

function extractMemberPartialModels<MS extends Record<string, Node>>(members: MS): { [K in keyof MS]: MS[K]['partial'] } {
	const x: any = Object.create(null)
	for (const key in members) {
		x[key as keyof MS] = members[key as keyof MS].partial
	}
	return x
}


export function fromDefinition<V extends NodeVariables>(
	variables: V
): M.Model<
	{ [K in keyof V]: TypeOfStrictInput<V[K]> },
	{ [K in keyof V]: TypeOfStrictOutput<V[K]> },
	{ [K in keyof V]: TypeOf<V[K]> }
> {
	return isEmptyObject(variables) ? (EMPTY_VARIABLES_MODEL as any) : M.type(extractMemberStrictModels(variables))
}

const STRING_TAG = 'String'

const NO_TRANSFORMATIONS = {
	decoding: false,
	encoding: false
}

export function useLocalModel<I, O, A>(model: M.Model<I, O, A>): M.Model<I, undefined, A> {
	return {
		...model,
		encode: constUndefined
	}
}

type ModifyOutputIfLocal<IsLocal, Output> = IsLocal extends true ? undefined : Output

export interface StringNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		string,
		ModifyOutputIfLocal<IsLocal, string>,
		string,
		string,
		ModifyOutputIfLocal<IsLocal, string>,
		string,
		string | undefined,
		Variables
	> {
	readonly tag: 'String'
	readonly __customCache?: CustomCache<
		string,
		ExtractNodeDefinitionType<Variables>,
		string | undefined
		>
}

export interface StaticStringNodeConfig<IsLocal extends boolean>
	extends StaticNodeConfig<string, string | undefined, {}, IsLocal> {}

export interface DynamicStringNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, string, string | undefined, {}, IsLocal> {}

export function string<IsLocal extends boolean = false>(
	config?: StaticStringNodeConfig<IsLocal>
): StringNode<{}, IsLocal>
export function string<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicStringNodeConfig<V, IsLocal>
): StringNode<V, IsLocal>
export function string<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticStringNodeConfig<IsLocal> | DynamicStringNodeConfig<V, IsLocal>
): StringNode<V, IsLocal> {
	const model = config?.isLocal ? useLocalModel(M.string) : (M.string as any)
	return {
		tag: STRING_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export const staticString = string()

export interface BooleanNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		boolean,
		ModifyOutputIfLocal<IsLocal, boolean>,
		boolean,
		boolean,
		ModifyOutputIfLocal<IsLocal, boolean>,
		boolean,
		boolean | undefined,
		Variables
	> {
	readonly tag: 'Boolean'
	readonly __customCache?: CustomCache<
		boolean,
		ExtractNodeDefinitionType<Variables>,
		boolean | undefined
		>
}

export interface StaticBooleanNodeConfig<IsLocal extends boolean>
	extends StaticNodeConfig<boolean, boolean | undefined, {}, IsLocal> {}

export interface DynamicBooleanNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, boolean, boolean | undefined, {}, IsLocal> {}

const BOOLEAN_TAG = 'Boolean'

export function boolean<IsLocal extends boolean = false>(
	config?: StaticBooleanNodeConfig<IsLocal>
): BooleanNode<{}, IsLocal>
export function boolean<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicBooleanNodeConfig<V, IsLocal>
): BooleanNode<V, IsLocal>
export function boolean<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticBooleanNodeConfig<IsLocal> | DynamicBooleanNodeConfig<V, IsLocal>
): BooleanNode<V, IsLocal> {
	const model = config?.isLocal ? useLocalModel(M.boolean) : (M.boolean as any)
	return {
		tag: BOOLEAN_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export const staticBoolean = boolean()

export interface IntNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		number,
		ModifyOutputIfLocal<IsLocal, number>,
		Int,
		number,
		ModifyOutputIfLocal<IsLocal, number>,
		Int,
		Int | undefined,
		Variables
	> {
	readonly tag: 'Int'
	readonly __customCache?: CustomCache<
		Int,
		ExtractNodeDefinitionType<Variables>,
		Int | undefined
		>

}

export interface StaticIntNodeConfig<IsLocal extends boolean>
	extends StaticNodeConfig<Int, Int | undefined, {}, IsLocal> {}

export interface DynamicIntNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, Int, Int | undefined, {}, IsLocal> {}

const INT_TAG = 'Int'

export function int<IsLocal extends boolean = false>(config?: StaticIntNodeConfig<IsLocal>): IntNode<{}, IsLocal>
export function int<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicIntNodeConfig<V, IsLocal>
): IntNode<V, IsLocal>
export function int<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticIntNodeConfig<IsLocal> | DynamicIntNodeConfig<V, IsLocal>
): IntNode<V, IsLocal> {
	const model = config?.isLocal ? useLocalModel(M.int) : (M.int as any)
	return {
		tag: INT_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export const staticInt = int()

export interface FloatNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<
		number,
		ModifyOutputIfLocal<IsLocal, number>,
		Float,
		number,
		ModifyOutputIfLocal<IsLocal, number>,
		Float,
		Float | undefined,
		Variables
	> {
	readonly tag: 'Float'
	readonly __customCache?: CustomCache<
		Float,
		ExtractNodeDefinitionType<Variables>,
		Float | undefined
		>

}

export interface StaticFloatNodeConfig<IsLocal extends boolean>
	extends StaticNodeConfig<Float, Float | undefined, {}, IsLocal> {}

export interface DynamicFloatNodeConfig<Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, Float, Float | undefined, {}, IsLocal> {}

const FLOAT_TAG = 'Float'

export function float<IsLocal extends boolean = false>(config?: StaticFloatNodeConfig<IsLocal>): FloatNode<{}, IsLocal>
export function float<V extends NodeVariables, IsLocal extends boolean = false>(
	config: DynamicFloatNodeConfig<V, IsLocal>
): FloatNode<V, IsLocal>
export function float<V extends NodeVariables = {}, IsLocal extends boolean = false>(
	config?: StaticFloatNodeConfig<IsLocal> | DynamicFloatNodeConfig<V, IsLocal>
): FloatNode<V, IsLocal> {
	const model = config?.isLocal ? useLocalModel(M.float) : (M.float as any)
	return {
		tag: FLOAT_TAG,
		strict: model,
		partial: model,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: NO_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export const staticFloat = float()

export interface ScalarNode<
	Name extends string,
	Input,
	Output,
	Data,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		Input,
		ModifyOutputIfLocal<IsLocal, Output>,
		Data,
		Input,
		ModifyOutputIfLocal<IsLocal, Output>,
		Data,
		Data | undefined,
		Variables
	> {
	readonly tag: 'Scalar'
	readonly name: Name
	readonly __customCache?: CustomCache<
		Data,
		ExtractNodeDefinitionType<Variables>,
		Data | undefined
		>

}

export interface StaticScalarNodeConfig<Data, IsLocal extends boolean>
	extends StaticNodeConfig<Data, Data | undefined, {}, IsLocal> {
	hasEncodingTransformations?: boolean;
	hasDecodingTransformations?: boolean;
}

export interface DynamicScalarNodeConfig<Data, Variables extends NodeVariables, IsLocal extends boolean>
	extends DynamicNodeConfig<Variables, Data, Data | undefined, {}, IsLocal> {
	hasEncodingTransformations?: boolean;
	hasDecodingTransformations?: boolean;
}

const SCALAR_TAG = 'Scalar'

export function scalar<Name extends string, Input, Output, Data, IsLocal extends boolean = false>(
	name: Name,
	model: M.Model<Input, Output, Data>,
	config?: StaticScalarNodeConfig<Data, IsLocal>
): ScalarNode<Name, Input, Output, Data, {}, IsLocal>
export function scalar<
	Name extends string,
	Input,
	Output,
	Data,
	V extends NodeVariables,
	IsLocal extends boolean = false
>(
	name: Name,
	model: M.Model<Input, Output, Data>,
	config: DynamicScalarNodeConfig<Data, V, IsLocal>
): ScalarNode<Name, Input, Output, Data, V, IsLocal>
export function scalar<
	Name extends string,
	Input,
	Output,
	Data,
	V extends NodeVariables,
	IsLocal extends boolean = false
>(
	name: Name,
	model: M.Model<Input, Output, Data>,
	config?: StaticScalarNodeConfig<Data, IsLocal> | DynamicScalarNodeConfig<Data, V, IsLocal>
): ScalarNode<Name, Input, Output, Data, V, IsLocal> {
	const m = config?.isLocal ? useLocalModel(model) : (model as any)
	return {
		tag: SCALAR_TAG,
		name,
		strict: m,
		partial: m,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: {
			encoding: config?.hasEncodingTransformations ?? true,
			decoding: config?.hasDecodingTransformations ?? true
		},
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

type Values<T> = T[keyof T]

type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

export type ExtractTypeNodeStrictDataFromMembers<MS extends Record<string, Node>> = { [K in keyof MS]: TypeOf<MS[K]> }

export type ExtractTypeNodeStrictInputFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]: TypeOfStrictInput<MS[K]>
}

export type ExtractTypeNodeStrictOutputFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]: TypeOfStrictOutput<MS[K]>
}

export type ExtractTypeNodePartialDataFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]?: TypeOfPartial<MS[K]>
}

export type ExtractTypeNodePartialInputFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]?: TypeOfPartialInput<MS[K]>
}

export type ExtractTypeNodePartialOutputFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]?: TypeOfPartialOutput<MS[K]>
}

export type ExtractTypeNodeCacheEntryFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]: TypeOfCacheEntry<MS[K]>
}

export type ExtractTypeNodeSubVariablesFromMembers<MS extends Record<string, Node>> = {} & Intersection<
	Values<
		{
			[K in keyof MS]: ExtractSubVariablesDefinition<MS[K]> & ExtractVariablesDefinition<MS[K]>
		}
	>
>

export interface TypenameNode<Name extends string> extends ScalarNode<Name, string, string, Name> {}

interface BaseTypeNode<
	Typename extends string,
	MS extends Record<string, Node>,
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
	MS extends Record<string, Node>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false
> = IncludeTypename extends true
	? BaseTypeNode<Typename, MS & { __typename: TypenameNode<Typename> }, Variables, IsLocal>
	: BaseTypeNode<Typename, MS, Variables, IsLocal>

export interface StaticTypeNodeConfig<
	MS extends Record<string, Node>,
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
	MS extends Record<string, Node>,
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

const TYPE_TAG = 'Type'

function hasEncodingTransformations(ms: Record<string, Node>): boolean {
	for (const k in ms) {
		if (ms[k]?.__hasTransformations?.encoding) {
			return true
		}
	}
	return false;
}

function hasDecodingTransformations(ms: Record<string, Node>): boolean {
	for (const k in ms) {
		if (ms[k]?.__hasTransformations?.decoding) {
			return true
		}
	}
	return false;
}

function getTypeMemberModel(strict: boolean, members: Record<string, Node>, isLocal: boolean, useIdEncoder: boolean, useIdDecoder: boolean): M.Model<any, any, any> {
	const m = strict ? M.type(extractMemberStrictModels(members)) : M.type(extractMemberPartialModels(members));
	if (isLocal) {
		return useLocalModel(m);
	}
	if (__DEV__ || !__DISABLE_VALIDATION__) {
		return m;
	}
	if (useIdEncoder && useIdDecoder) {
		return M.useIdentityDecoder(M.useIdentityEncoder(m));
	}
	if (useIdEncoder) {
		return M.useIdentityEncoder(m);
	}
	if (useIdDecoder) {
		return M.useIdentityDecoder(m);
	}
	return m as any;
}

function getTypeMemberStrictModel<MS extends Record<string, Node>, IsLocal extends boolean>(members: MS, isLocal: IsLocal, useIdEncoder: boolean, useIdDecoder: boolean): M.Model<
	ExtractTypeNodeStrictInputFromMembers<MS>,
	ModifyOutputIfLocal<IsLocal, ExtractTypeNodeStrictOutputFromMembers<MS>>,
	ExtractTypeNodeStrictDataFromMembers<MS>
	> {
	return getTypeMemberModel(true, members, isLocal, useIdEncoder, useIdDecoder)
}

function getTypeMemberPartialModel<MS extends Record<string, Node>, IsLocal extends boolean>(members: MS, isLocal: IsLocal, useIdEncoder: boolean, useIdDecoder: boolean): M.Model<
	ExtractTypeNodeStrictInputFromMembers<MS>,
	ModifyOutputIfLocal<IsLocal, ExtractTypeNodeStrictOutputFromMembers<MS>>,
	ExtractTypeNodeStrictDataFromMembers<MS>
	> {
	return getTypeMemberModel(false, members, isLocal, useIdEncoder, useIdDecoder)
}

export function type<
	Typename extends string,
	MS extends Record<string, Node>,
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false
>(
	__typename: Typename,
	ms: MS,
	config?: StaticTypeNodeConfig<MS, IsLocal, IncludeTypename>
): TypeNode<Typename, MS, {}, IsLocal, IncludeTypename>
export function type<
	Typename extends string,
	MS extends Record<string, Node>,
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
	MS extends Record<string, Node>,
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
	const useIdDecoder = !hasDecodingTransformations(ms);
	const useIdEncoder = !hasEncodingTransformations(ms)
	return {
		tag: TYPE_TAG,
		__typename,
		members,
		strict: getTypeMemberStrictModel(members, !!config?.isLocal, useIdEncoder, useIdDecoder),
		partial: getTypeMemberPartialModel(members, !!config?.isLocal, useIdEncoder, useIdDecoder),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__transformations: {
			encoding: !useIdEncoder,
			decoding: !useIdDecoder
		},
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	} as any
}

export function schema<Typename extends string, MS extends Record<string, Node>>(
	__typename: Typename,
	members: MS
): TypeNode<Typename, MS> {
	return type(__typename, members)
}

export interface ArrayNode<
	Wrapped extends Node,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
	>
	extends BaseNode<
		Array<TypeOfStrictInput<Wrapped>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfStrictOutput<Wrapped>>>,
		Array<TypeOf<Wrapped>>,
		Array<TypeOfPartialInput<Wrapped>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfPartialOutput<Wrapped>>>,
		Array<TypeOfPartial<Wrapped>>,
		Array<TypeOfPartial<Wrapped>>,
		Variables,
		ExtractSubVariablesDefinition<Wrapped> & ExtractVariablesDefinition<Wrapped>
		> {
	readonly tag: 'Array'
	readonly wrapped: Wrapped
	readonly __customCache?: CustomCache<
		Array<TypeOfPartial<Wrapped>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Wrapped> & ExtractVariablesDefinition<Wrapped> & Variables>,
		Array<TypeOfPartial<Wrapped>>
		>

}

export interface StaticArrayNodeConfig<
	Wrapped extends Node,
	IsLocal extends boolean,
	>
	extends StaticNodeConfig<
		Array<TypeOfPartial<Wrapped>>,
		Array<TypeOfPartial<Wrapped>>,
		{},
		IsLocal
		> {
}

export interface DynamicArrayNodeConfig<
	Wrapped extends Node,
	Variables extends NodeVariables,
	IsLocal extends boolean
	>
	extends DynamicNodeConfig<
		Variables,
		Array<TypeOfPartial<Wrapped>>,
		Array<TypeOfPartial<Wrapped>>,
		{},
		IsLocal
		> {
}

export function array<
	Wrapped extends Node
	IsLocal extends boolean = false,
	IncludeTypename extends boolean = false
	>(
	__typename: Typename,
	ms: MS,
	config?: StaticTypeNodeConfig<MS, IsLocal, IncludeTypename>
): TypeNode<Typename, MS, {}, IsLocal, IncludeTypename>
export function type<
	Typename extends string,
	MS extends Record<string, Node>,
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
	MS extends Record<string, Node>,
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
	const useIdDecoder = !hasDecodingTransformations(ms);
	const useIdEncoder = !hasEncodingTransformations(ms)
	return {
		tag: TYPE_TAG,
		__typename,
		members,
		strict: getTypeMemberStrictModel(members, !!config?.isLocal, useIdEncoder, useIdDecoder),
		partial: getTypeMemberPartialModel(members, !!config?.isLocal, useIdEncoder, useIdDecoder),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__transformations: {
			encoding: !useIdEncoder,
			decoding: !useIdDecoder
		},
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	} as any
}


