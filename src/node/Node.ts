import { Ref } from '@vue/reactivity'
import { Eq } from 'fp-ts/lib/Eq'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { Encoder } from 'io-ts/lib/Encoder'
import * as M from '../model/Model'
import { isEmptyObject } from '../shared'

export type TypeOf<T> = T extends { readonly strictModel: M.Model<infer A> } ? A : never

export type TypeOfPartial<T> = T extends { readonly partialModel: M.Model<infer A> } ? A : never

export type TypeOfVariables<T> = ExtractDefinitionType<ExtractVariablesDefinition<T>>

export type TypeOfChildrenVariables<T> = ExtractDefinitionType<ExtractChildrenVariablesDefinition<T>>

export type TypeOfMergedVariables<T> = TypeOfVariables<T> & TypeOfChildrenVariables<T>

export type TypeOfRefs<T> = T extends { readonly __refs__?: infer A } ? A : never

export type TypeOfCacheEntry<T> = T extends { readonly __cache_entry__?: infer A } ? A : never

export type Node<Variables extends {} = any> =
	| PrimitiveNode<Variables>
	| WrappedNode<Variables>
	| TypeNode<any, any, any, any, any, any, Variables, any>
	| SumNode<any, any, any, any, any, Variables, any>
	| ScalarNode<any, any, any, any, any, Variables, any>
	| MutationNode<any, any, any, any, any, Variables, any>

export type PrimitiveNode<Variables extends {} = {}> =
	| StringNode<any, any, any, Variables, any>
	| BooleanNode<any, any, any, Variables, any>
	| FloatNode<any, any, any, Variables, any>
	| IntNode<any, any, any, Variables, any>

export interface StringNode<
	Data = string,
	PartialData = string,
	RefsData = Ref<O.Option<string>>,
	CacheEntry = Ref<O.Option<string>>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables> {
	readonly tag: 'String'
}

export interface BooleanNode<
	Data = boolean,
	PartialData = boolean,
	RefsData = Ref<O.Option<boolean>>,
	CacheEntry = Ref<O.Option<boolean>>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables> {
	readonly tag: 'Boolean'
}

export interface IntNode<
	Data = number,
	PartialData = number,
	RefsData = Ref<O.Option<number>>,
	CacheEntry = Ref<O.Option<number>>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables> {
	readonly tag: 'Int'
}

export interface FloatNode<
	Data = number,
	PartialData = number,
	RefsData = Ref<O.Option<number>>,
	CacheEntry = Ref<O.Option<number>>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables> {
	readonly tag: 'Float'
}

export type ExtractTypeNodeDataFromMembers<Members> = { [K in keyof Members]: TypeOf<Members[K]> }

export type ExtractTypeNodePartialDataFromMembers<Members> = Partial<
	{ [K in keyof Members]: TypeOfPartial<Members[K]> }
>

export type ExtractTypeNodeRefsFromMembers<Members> = { [K in keyof Members]: TypeOfRefs<Members[K]> }

export type ExtractTypeNodeChildrenVariablesFromMembers<Members> = {} & Intersection<
	Values<
		{
			[K in keyof Members]: ExtractChildrenVariablesDefinition<Members[K]> &
				ExtractVariablesDefinition<Members[K]>
		}
	>
>

export type ExtractTypeNodeCacheEntryFromMembers<Members> = {
	[K in keyof Members]: ExtractVariablesDefinition<Members[K]> extends NonEmptyObject<
		ExtractVariablesDefinition<Members[K]>
	>
		? CacheNode<TypeOfCacheEntry<Members[K]>>
		: TypeOfCacheEntry<Members[K]>
}

type NonEmptyObject<T> = keyof T extends never ? never : T

export interface TypeNode<
	Typename extends string,
	Members extends { [K in keyof Members]: Node },
	Data = ExtractTypeNodeDataFromMembers<Members>,
	PartialData = ExtractTypeNodePartialDataFromMembers<Members>,
	RefsData = ExtractTypeNodeRefsFromMembers<Members>,
	CacheEntry = ExtractTypeNodeCacheEntryFromMembers<Members>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractTypeNodeChildrenVariablesFromMembers<Members>
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
	readonly __typename: Typename
	readonly tag: 'Type'
	readonly members: Members
}

export type SchemaNode<N extends string, T extends { [K in keyof T]: Node }> = TypeNode<N, T>

export type WrappedNode<Variables extends {} = {}> =
	| ArrayNode<any, any, any, any, any, Variables, any>
	| MapNode<any, any, any, any, any, any, Variables, any>
	| OptionNode<any, any, any, any, any, Variables, any>
	| NonEmptyArrayNode<any, any, any, any, any, Variables, any>

export type ExtractArrayNodeDataFromWrapped<Wrapped> = Array<TypeOf<Wrapped>>

export type ExtractArrayNodePartialDataFromWrapped<Wrapped> = Array<TypeOfPartial<Wrapped>>

export type ExtractArrayNodeRefsFromWrapped<Wrapped> = Ref<Array<TypeOfRefs<Wrapped>>>

export type ExtractChildrenVariablesDefinitionFromWrapped<Wrapped> = {} & ExtractChildrenVariablesDefinition<Wrapped> &
	ExtractVariablesDefinition<Wrapped>

export type ExtractArrayNodeCacheEntryFromWrapped<Wrapped> = Ref<Array<TypeOfCacheEntry<Wrapped>>>

export interface ArrayNode<
	Wrapped extends Node,
	Data = ExtractArrayNodeDataFromWrapped<Wrapped>,
	PartialData = ExtractArrayNodePartialDataFromWrapped<Wrapped>,
	RefsData = ExtractArrayNodeRefsFromWrapped<Wrapped>,
	CacheEntry = ExtractArrayNodeCacheEntryFromWrapped<Wrapped>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
	readonly tag: 'Array'
	readonly wrapped: Wrapped
}

export type ExtractMapNodeDataFromKeyValue<Key, Value> = Map<TypeOf<Key>, TypeOf<Value>>

export type ExtractMapNodePartialDataFromKeyValue<Key, Value> = Map<TypeOf<Key>, TypeOfPartial<Value>>

export type ExtractMapNodeRefsFromKeyValue<Key, Value> = Ref<Map<TypeOf<Key>, TypeOfRefs<Value>>>

export type ExtractMapNodeCacheEntryFromKeyValue<Key, Value> = Ref<Map<TypeOf<Key>, TypeOfCacheEntry<Value>>>

export interface MapNode<
	Key extends Node,
	Value extends Node,
	Data = ExtractMapNodeDataFromKeyValue<Key, Value>,
	PartialData = ExtractMapNodePartialDataFromKeyValue<Key, Value>,
	RefsData = ExtractMapNodeRefsFromKeyValue<Key, Value>,
	CacheEntry = ExtractMapNodeCacheEntryFromKeyValue<Key, Value>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Value>
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
	readonly tag: 'Map'
	readonly key: Key
	readonly wrapped: Value
}

export type ExtractOptionNodeDataFromWrapped<Wrapped> = O.Option<TypeOf<Wrapped>>

export type ExtractOptionNodePartialDataFromWrapped<Wrapped> = O.Option<TypeOfPartial<Wrapped>>

export type ExtractOptionNodeRefsFromWrapped<Wrapped> = Ref<O.Option<TypeOfRefs<Wrapped>>>

export type ExtractOptionNodeCacheEntryFromWrapped<Wrapped> = Ref<O.Option<TypeOfCacheEntry<Wrapped>>>

export interface OptionNode<
	Wrapped extends Node,
	Data = ExtractOptionNodeDataFromWrapped<Wrapped>,
	PartialData = ExtractOptionNodePartialDataFromWrapped<Wrapped>,
	RefsData = ExtractOptionNodeRefsFromWrapped<Wrapped>,
	CacheEntry = ExtractOptionNodeCacheEntryFromWrapped<Wrapped>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
	readonly tag: 'Option'
	readonly wrapped: Wrapped
}

export type ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped> = NonEmptyArray<TypeOf<Wrapped>>

export type ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped> = NonEmptyArray<TypeOfPartial<Wrapped>>

export type ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped> = Ref<O.Option<NonEmptyArray<TypeOfRefs<Wrapped>>>>

export type ExtractNonEmptyArrayNodeCacheEntryFromWrapped<Wrapped> = Ref<
	O.Option<NonEmptyArray<TypeOfCacheEntry<Wrapped>>>
>

export interface NonEmptyArrayNode<
	Wrapped extends Node,
	Data = ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped>,
	PartialData = ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped>,
	RefsData = ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped>,
	CacheEntry = ExtractNonEmptyArrayNodeCacheEntryFromWrapped<Wrapped>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
	readonly tag: 'NonEmptyArray'
	readonly wrapped: Wrapped
}

type ExtractTypeName<T> = T extends TypeNode<infer A, any, any, any, any, any, any, any> ? A : never

export type ExtractSumNodeDataFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>
> = { [K in keyof Members]: TypeOf<Members[K]> & { __typename: ExtractTypeName<Members[K]> } }[number]

export type ExtractSumNodePartialDataFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>
> = {
	[K in keyof Members]: TypeOfPartial<Members[K]> & { __typename?: ExtractTypeName<Members[K]> }
}[number]

export type ExtractSumNodeRefsFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>
> = Ref<O.Option<{ [K in keyof Members]: TypeOfRefs<Members[K]> }[number]>>

export type ExtractSumNodeChildrenVariablesDefinitionFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>
> = {} & Intersection<
	{
		[K in keyof Members]: ExtractChildrenVariablesDefinition<Members[K]> & ExtractVariablesDefinition<Members[K]>
	}[number]
>

export type ExtractSumNodeCacheEntryFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>
> = { [K in keyof Members]: Ref<O.Option<[ExtractTypeName<Members[K]>, TypeOfCacheEntry<Members[K]>]>> }[number]

export interface SumNode<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>,
	Data = ExtractSumNodeDataFromMembers<Members>,
	PartialData = ExtractSumNodePartialDataFromMembers<Members>,
	RefsData = ExtractSumNodeRefsFromMembers<Members>,
	CacheEntry = ExtractSumNodeCacheEntryFromMembers<Members>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractSumNodeChildrenVariablesDefinitionFromMembers<Members>
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
	readonly tag: 'Sum'
	readonly members: Members
	readonly membersRecord: Record<ExtractTypeName<{ [K in keyof Members]: Members[K] }[number]>, Members[number]>
}

export interface MutationNode<
	Result extends Node,
	Data = TypeOf<Node>,
	PartialData = TypeOfPartial<Node>,
	RefsData = TypeOfRefs<Result>,
	CacheEntry = TypeOfCacheEntry<Result>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {} & ExtractChildrenVariablesDefinition<Result>
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
	readonly tag: 'Mutation'
	readonly result: Result
}

export interface ScalarNode<
	Name extends string,
	Data,
	PartialData = Data,
	RefsData = Ref<O.Option<Data>>,
	CacheEntry = Ref<O.Option<Data>>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
	readonly tag: 'Scalar'
	readonly name: Name
}

interface NodeDefinition<
	StrictData,
	PartialData,
	RefsData,
	CacheEntry,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {}
> {
	readonly tag: string
	readonly strictModel: M.Model<StrictData>
	readonly partialModel: M.Model<PartialData>
	readonly variablesModel: M.Model<ExtractDefinitionType<Variables>>
	// for internal use

	readonly __sub_variables_definition__: ChildrenVariables
	readonly __variables_definition__: Variables
	readonly __cache_entry__?: CacheEntry
	readonly __refs__?: RefsData
	readonly __cache__?: NodeCacheConfig
}

export type EncodedVariables = string

export interface CacheNode<CacheEntry> extends Map<EncodedVariables, CacheEntry> {}

export interface CustomCache<T> {
	(schemaNode: T, requestNode: T, variables: TypeOfMergedVariables<T>, data?: TypeOfPartial<T>): O.Option<
		TypeOfCacheEntry<T>
	>
}

export interface NodeCacheConfig<T = any> {
	readonly isEntity?: boolean
	readonly isLocal?: boolean
	readonly useCustomCache?: CustomCache<T>
}

export interface NodeVariablesDefinition {
	[K: string]: Node
}

export type ExtractVariablesDefinition<T> = T extends { readonly __variables_definition__: infer A } ? A : never

export type ExtractDefinitionType<V> = {
	[K in keyof V]: TypeOf<V[K]>
}

export type ExtractChildrenVariablesDefinition<T> = T extends { readonly __sub_variables_definition__: infer A }
	? A
	: never

type Values<T> = T[keyof T]

type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

const EMPTY_VARIABLES_MODEL = M.type({})

const EMPTY_VARIABLES: any = {}

export function getDefinitionModel<V extends NodeVariablesDefinition>(
	variables: V
): M.Model<{ [K in keyof V]: TypeOf<V[K]> }> {
	return isEmptyObject(variables) ? (EMPTY_VARIABLES_MODEL as any) : M.type(extractTypeMemberStrictModels(variables))
}

export function int(): IntNode
export function int<V extends NodeVariablesDefinition>(
	variables: V
): IntNode<number, number, Ref<O.Option<number>>, Ref<O.Option<number>>, V>
export function int<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): IntNode<number, number, Ref<O.Option<number>>, Ref<O.Option<number>>, V> {
	return {
		tag: 'Int',
		strictModel: M.number,
		partialModel: M.number,
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: EMPTY_VARIABLES,
		__variables_definition__: variables
	}
}

export const staticInt = int()

export function float(): FloatNode
export function float<V extends NodeVariablesDefinition>(
	variables: V
): FloatNode<number, number, Ref<O.Option<number>>, Ref<O.Option<number>>, V>
export function float<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): FloatNode<number, number, Ref<O.Option<number>>, Ref<O.Option<number>>, V> {
	return {
		tag: 'Float',
		strictModel: M.number,
		partialModel: M.number,
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: EMPTY_VARIABLES,
		__variables_definition__: variables
	}
}

export const staticFloat = float()

export function string(): StringNode
export function string<V extends NodeVariablesDefinition>(
	variables: V
): StringNode<string, string, Ref<O.Option<string>>, Ref<O.Option<string>>, V>
export function string<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): StringNode<string, string, Ref<O.Option<string>>, Ref<O.Option<string>>, V> {
	return {
		tag: 'String',
		strictModel: M.string,
		partialModel: M.string,
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: EMPTY_VARIABLES,
		__variables_definition__: variables
	}
}

export const staticString = string()

export function boolean(): BooleanNode
export function boolean<V extends NodeVariablesDefinition>(
	variables: V
): BooleanNode<boolean, boolean, Ref<O.Option<boolean>>, Ref<O.Option<boolean>>, V>
export function boolean<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): BooleanNode<boolean, boolean, Ref<O.Option<boolean>>, Ref<O.Option<boolean>>, V> {
	return {
		tag: 'Boolean',
		strictModel: M.boolean,
		partialModel: M.boolean,
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: EMPTY_VARIABLES,
		__variables_definition__: variables
	}
}

export const staticBoolean = boolean()

export function scalar<Name extends string, Data>(
	name: Name,
	model: M.Model<Data>
): ScalarNode<Name, Data, Data, Ref<O.Option<Data>>>
export function scalar<Name extends string, Data, Variables extends NodeVariablesDefinition>(
	name: Name,
	model: M.Model<Data>,
	variables: Variables
): ScalarNode<Name, Data, Data, Ref<O.Option<Data>>, Ref<O.Option<Data>>, Variables>
export function scalar<Name extends string, Data, Variables extends NodeVariablesDefinition = {}>(
	name: Name,
	model: M.Model<Data>,
	variables: Variables = EMPTY_VARIABLES
): ScalarNode<Name, Data, Data, Ref<O.Option<Data>>, Ref<O.Option<Data>>, Variables> {
	return {
		name,
		tag: 'Scalar',
		strictModel: model,
		partialModel: model,
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: EMPTY_VARIABLES,
		__variables_definition__: variables
	}
}

function mergeNodeVariables<T extends Node>(
	node: T
): {} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T> {
	const x: any = {}
	for (const [k, v] of Object.entries(node.__sub_variables_definition__)) {
		if (x[k] !== undefined) {
			console.warn(
				`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
			)
		}
		x[k] = v
	}

	for (const [k, v] of Object.entries(node.__variables_definition__)) {
		if (x[k] !== undefined) {
			console.warn(
				`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
			)
		}
		x[k] = v
	}
	return x
}

function getTypeChildrenVariables<T extends { [K in keyof T]: Node }>(
	members: T
): {} & Intersection<
	Values<{ [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]> }>
> {
	const x: any = {}
	for (const k in members) {
		Object.assign(x, mergeNodeVariables(members[k]))
	}
	return x
}

function extractTypeMemberStrictModels<Members extends { [K in keyof Members]: Node }>(
	members: Members
): { [K in keyof Members]: Members[K]['strictModel'] } {
	const x: any = {}
	for (const key in members) {
		x[key as keyof Members] = members[key as keyof Members].strictModel
	}
	return x
}

function extractTypeMemberPartialModels<Members extends { [K in keyof Members]: Node }>(
	members: Members
): { [K in keyof Members]: Members[K]['partialModel'] } {
	const x: any = {}
	for (const key in members) {
		x[key as keyof Members] = members[key as keyof Members].partialModel
	}
	return x
}

export function type<Name extends string, Members extends { [K in keyof Members]: Node }>(
	__typename: Name,
	members: Members
): TypeNode<Name, Members>
export function type<
	Name extends string,
	Members extends { [K in keyof Members]: Node },
	Variables extends NodeVariablesDefinition
>(
	__typename: Name,
	members: Members,
	variables: Variables
): TypeNode<
	Name,
	Members,
	ExtractTypeNodeDataFromMembers<Members>,
	ExtractTypeNodePartialDataFromMembers<Members>,
	ExtractTypeNodeRefsFromMembers<Members>,
	ExtractTypeNodeCacheEntryFromMembers<Members>,
	Variables
>
export function type<
	Name extends string,
	Members extends { [K in keyof Members]: Node },
	Variables extends NodeVariablesDefinition = {}
>(
	__typename: Name,
	members: Members,
	variables: Variables = EMPTY_VARIABLES
): TypeNode<
	Name,
	Members,
	ExtractTypeNodeDataFromMembers<Members>,
	ExtractTypeNodePartialDataFromMembers<Members>,
	ExtractTypeNodeRefsFromMembers<Members>,
	ExtractTypeNodeCacheEntryFromMembers<Members>,
	Variables
> {
	return {
		__typename,
		tag: 'Type',
		members,
		strictModel: M.type(extractTypeMemberStrictModels(members)) as any,
		partialModel: M.partial(extractTypeMemberPartialModels(members)) as any,
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: getTypeChildrenVariables(members),
		__variables_definition__: variables
	}
}

export function schema<Name extends string, Members extends { [K in keyof Members]: Node }>(
	__typename: Name,
	members: Members
): TypeNode<Name, Members> {
	return type(__typename, members)
}

function getSumObject<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(...members: Members) {
	const m: any = {}
	members.forEach((member) => {
		m[member.__typename] = M.type({
			__typename: M.literal(member.__typename),
			...extractTypeMemberStrictModels(member.members)
		})
	})
	return m
}

const sumTypename = M.sum('__typename')

function getSumModel<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(
	...members: Members
): M.Model<{ [K in keyof Members]: TypeOf<Members[K]> & { __typename: ExtractTypeName<Members[K]> } }[number]> {
	return sumTypename(getSumObject(...members))
}

function getSumPartialModel<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(
	...members: Members
): M.Model<{ [K in keyof Members]: TypeOfPartial<Members[K]> & { __typename?: ExtractTypeName<Members[K]> } }[number]> {
	return sumTypename(getSumObject(...members))
}

function getSumChildrenVariables<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(
	...members: Members
): ExtractSumNodeChildrenVariablesDefinitionFromMembers<Members> {
	const x: any = {}
	members.forEach((member) => Object.assign(x, mergeNodeVariables(member)))
	return x
}

function getSumMembersRecord<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(
	...members: Members
): Record<ExtractTypeName<{ [K in keyof Members]: Members[K] }[number]>, Members[number]> {
	const x: any = {}
	members.forEach((member) => {
		x[member.__typename] = member
	})
	return x
}

export function sum<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(...members: Members) {
	return <Variables extends NodeVariablesDefinition>(
		variables: Variables = EMPTY_VARIABLES
	): SumNode<
		Members,
		ExtractSumNodeDataFromMembers<Members>,
		ExtractSumNodePartialDataFromMembers<Members>,
		ExtractSumNodeRefsFromMembers<Members>,
		ExtractSumNodeCacheEntryFromMembers<Members>,
		Variables
	> => {
		const newMembers = members.map((member) =>
			member.members.hasOwnProperty('__typename')
				? member
				: type(
						member.__typename,
						{ ...member.members, __typename: scalar(member.__typename, M.literal(member.__typename)) },
						member.__variables_definition__
				  )
		)
		return {
			members,
			tag: 'Sum',
			strictModel: getSumModel(...newMembers),
			partialModel: getSumPartialModel(...newMembers),
			variablesModel: getDefinitionModel(variables),
			membersRecord: getSumMembersRecord(...newMembers),
			__variables_definition__: variables,
			__sub_variables_definition__: getSumChildrenVariables(...newMembers)
		}
	}
}

export function map<Key extends Node<{}>, Value extends Node<{}>>(key: Key, value: Value): MapNode<Key, Value>
export function map<Key extends Node<{}>, Value extends Node<{}>, Variables extends NodeVariablesDefinition>(
	key: Key,
	value: Value,
	variables: Variables
): MapNode<
	Key,
	Value,
	ExtractMapNodeDataFromKeyValue<Key, Value>,
	ExtractMapNodePartialDataFromKeyValue<Key, Value>,
	ExtractMapNodeRefsFromKeyValue<Key, Value>,
	ExtractMapNodeCacheEntryFromKeyValue<Key, Value>,
	Variables
>
export function map<Key extends Node<{}>, Value extends Node<{}>, Variables extends NodeVariablesDefinition = {}>(
	key: Key,
	value: Value,
	variables: Variables = EMPTY_VARIABLES
): MapNode<
	Key,
	Value,
	ExtractMapNodeDataFromKeyValue<Key, Value>,
	ExtractMapNodePartialDataFromKeyValue<Key, Value>,
	ExtractMapNodeRefsFromKeyValue<Key, Value>,
	ExtractMapNodeCacheEntryFromKeyValue<Key, Value>,
	Variables
> {
	if (!isEmptyObject(key.__variables_definition__)) {
		console.warn(`variables will be ignored on map key`)
	}
	if (!isEmptyObject(value.__variables_definition__)) {
		console.warn(`variables will be ignored on map value`)
	}

	return {
		key,
		tag: 'Map',
		strictModel: M.map(key.strictModel, value.strictModel),
		partialModel: M.map(key.strictModel, value.partialModel),
		variablesModel: getDefinitionModel(variables),
		wrapped: value,
		__sub_variables_definition__: mergeNodeVariables(value),
		__variables_definition__: variables
	}
}

export function array<Wrapped extends Node<{}>>(wrapped: Wrapped): ArrayNode<Wrapped>
export function array<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition>(
	wrapped: Wrapped,
	variables: Variables
): ArrayNode<
	Wrapped,
	ExtractArrayNodeDataFromWrapped<Wrapped>,
	ExtractArrayNodePartialDataFromWrapped<Wrapped>,
	ExtractArrayNodeRefsFromWrapped<Wrapped>,
	ExtractArrayNodeCacheEntryFromWrapped<Wrapped>,
	Variables
>
export function array<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition = {}>(
	wrapped: Wrapped,
	variables: Variables = EMPTY_VARIABLES
): ArrayNode<
	Wrapped,
	ExtractArrayNodeDataFromWrapped<Wrapped>,
	ExtractArrayNodePartialDataFromWrapped<Wrapped>,
	ExtractArrayNodeRefsFromWrapped<Wrapped>,
	ExtractArrayNodeCacheEntryFromWrapped<Wrapped>,
	Variables
> {
	if (!isEmptyObject(wrapped.__variables_definition__)) {
		console.warn(`variables will be ignored on array value`)
	}

	return {
		tag: 'Array',
		wrapped,
		strictModel: M.array(wrapped.strictModel),
		partialModel: M.array(wrapped.partialModel),
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: mergeNodeVariables(wrapped),
		__variables_definition__: variables
	}
}

export function option<Wrapped extends Node<{}>>(wrapped: Wrapped): OptionNode<Wrapped>
export function option<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition>(
	wrapped: Wrapped,
	variables: Variables
): OptionNode<
	Wrapped,
	ExtractOptionNodeDataFromWrapped<Wrapped>,
	ExtractOptionNodePartialDataFromWrapped<Wrapped>,
	ExtractOptionNodeRefsFromWrapped<Wrapped>,
	ExtractOptionNodeCacheEntryFromWrapped<Wrapped>,
	Variables
>
export function option<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition = {}>(
	wrapped: Wrapped,
	variables: Variables = EMPTY_VARIABLES
): OptionNode<
	Wrapped,
	ExtractOptionNodeDataFromWrapped<Wrapped>,
	ExtractOptionNodePartialDataFromWrapped<Wrapped>,
	ExtractOptionNodeRefsFromWrapped<Wrapped>,
	ExtractOptionNodeCacheEntryFromWrapped<Wrapped>,
	Variables
> {
	if (!isEmptyObject(wrapped.__variables_definition__)) {
		console.warn(`variables will be ignored on option value`)
	}

	return {
		tag: 'Option',
		wrapped,
		strictModel: M.option(wrapped.strictModel),
		partialModel: M.option(wrapped.partialModel),
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: mergeNodeVariables(wrapped),
		__variables_definition__: variables
	}
}

export function nonEmptyArray<Wrapped extends Node<{}>>(wrapped: Wrapped): NonEmptyArrayNode<Wrapped>
export function nonEmptyArray<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition>(
	wrapped: Wrapped,
	variables: Variables
): NonEmptyArrayNode<
	Wrapped,
	ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodeCacheEntryFromWrapped<Wrapped>,
	Variables
>
export function nonEmptyArray<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition = {}>(
	wrapped: Wrapped,
	variables: Variables = EMPTY_VARIABLES
): NonEmptyArrayNode<
	Wrapped,
	ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodeCacheEntryFromWrapped<Wrapped>,
	Variables
> {
	if (!isEmptyObject(wrapped.__variables_definition__)) {
		console.warn(`variables will be ignored on nonEmptyArray value`)
	}

	return {
		tag: 'NonEmptyArray',
		wrapped,
		strictModel: M.nonEmptyArray(wrapped.strictModel),
		partialModel: M.nonEmptyArray(wrapped.partialModel),
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: mergeNodeVariables(wrapped),
		__variables_definition__: variables
	}
}

export function mutation<Result extends Node>(result: Result): MutationNode<Result>
export function mutation<Result extends Node, Variables extends NodeVariablesDefinition>(
	result: Result,
	variables: Variables
): MutationNode<Result, TypeOf<Result>, TypeOfPartial<Result>, TypeOfRefs<Result>, TypeOfCacheEntry<Result>, Variables>
export function mutation<Result extends Node, Variables extends NodeVariablesDefinition = {}>(
	result: Result,
	variables: Variables = EMPTY_VARIABLES
): MutationNode<
	Result,
	TypeOf<Result>,
	TypeOfPartial<Result>,
	TypeOfRefs<Result>,
	TypeOfCacheEntry<Result>,
	Variables
> {
	return {
		tag: 'Mutation',
		result: result,
		strictModel: result.strictModel,
		partialModel: result.partialModel,
		variablesModel: getDefinitionModel(variables),
		__sub_variables_definition__: mergeNodeVariables(result),
		__variables_definition__: variables
	}
}

export function pickFromType<T extends TypeNode<any, any, any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	...keys: P[]
): TypeNode<
	T['__typename'],
	Pick<T['members'], P>,
	ExtractTypeNodeDataFromMembers<Pick<T['members'], P>>,
	ExtractTypeNodePartialDataFromMembers<Pick<T['members'], P>>,
	ExtractTypeNodeRefsFromMembers<Pick<T['members'], P>>,
	ExtractTypeNodeCacheEntryFromMembers<Pick<T['members'], P>>,
	ExtractVariablesDefinition<T>
> {
	const n: any = {}
	keys.forEach((k) => {
		n[k] = node.members[k]
	})
	return type(node.__typename, n, node.__variables_definition__) as any
}

export function omitFromType<T extends TypeNode<any, any, any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	...keys: P[]
): TypeNode<
	T['__typename'],
	Omit<T['members'], P>,
	ExtractTypeNodeDataFromMembers<Omit<T['members'], P>>,
	ExtractTypeNodePartialDataFromMembers<Omit<T['members'], P>>,
	ExtractTypeNodeRefsFromMembers<Omit<T['members'], P>>,
	ExtractTypeNodeCacheEntryFromMembers<Omit<T['members'], P>>,
	ExtractVariablesDefinition<T>
> {
	const n: any = {}
	const members = node.members
	for (const k in members) {
		if (!keys.includes(k as P)) {
			n[k] = members[k as keyof T]
		}
	}
	return type(node.__typename, n, node.__variables_definition__) as any
}

export function useEq<T extends NodeDefinition<any, any, any, any, any, any>>(node: T, eq: Eq<TypeOf<T>>): T {
	return {
		...node,
		strictModel: M.useEq(node.strictModel, eq)
	}
}

export function eqById<T extends TypeNode<any, Record<'id', Node>, any, any, any, any, any, any>>(node: T): T {
	return {
		...node,
		strictModel: M.eqById(node.strictModel)
	}
}

export function useEncoder<T extends NodeDefinition<any, any, any, any, any>>(node: T, encoder: Encoder<TypeOf<T>>): T {
	return {
		...node,
		strictModel: M.useEncoder(node.strictModel, encoder)
	}
}

export function encodeById<T extends TypeNode<any, Record<'id', Node>, any, any, any, any, any, any>>(node: T): T
export function encodeById<
	T extends SumNode<ReadonlyArray<TypeNode<any, Record<'id', Node>, any, any, any, any, any, any>>>
>(node: T): T
export function encodeById<
	T extends
		| TypeNode<any, Record<'id', Node>, any, any, any, any, any, any>
		| SumNode<ReadonlyArray<TypeNode<any, Record<'id', Node>, any, any, any, any, any, any>>>
>(node: T): T {
	switch (node.tag) {
		case 'Type':
			return {
				...node,
				strictModel: M.useEncoder(node.strictModel, {
					encode: (a) => (node as TypeNode<any, Record<'id', Node>>).members.id.strictModel.encode(a.id)
				})
			}
		case 'Sum':
			const o = getSumObject(...(node.members as ReadonlyArray<TypeNode<any, Record<'id', Node>>>))
			return {
				...node,
				strictModel: {
					...node.strictModel,
					encode: (a) => {
						return o[a.__typename].encode(a.id)
					}
				}
			}
	}
}

type ExtractEntityType<T extends Node> = T extends TypeNode<any, any, any, any, any, any, any, any>
	? TypeNode<
			T['__typename'],
			T['members'],
			ExtractTypeNodeDataFromMembers<T['members']>,
			ExtractTypeNodePartialDataFromMembers<T['members']>,
			Ref<O.Option<TypeOf<T>>>,
			Ref<O.Option<TypeOf<T>>>,
			ExtractVariablesDefinition<T>
	  >
	: T extends ArrayNode<any, any, any, any, any, any, any>
	? ArrayNode<
			T['wrapped'],
			ExtractArrayNodeDataFromWrapped<T['wrapped']>,
			ExtractArrayNodePartialDataFromWrapped<T['wrapped']>,
			Ref<O.Option<TypeOf<T['wrapped']>[]>>,
			Ref<O.Option<TypeOf<T['wrapped']>[]>>,
			ExtractVariablesDefinition<T>
	  >
	: T extends NonEmptyArrayNode<any, any, any, any, any, any, any>
	? NonEmptyArrayNode<
			T['wrapped'],
			ExtractNonEmptyArrayNodeDataFromWrapped<T['wrapped']>,
			ExtractNonEmptyArrayNodePartialDataFromWrapped<T['wrapped']>,
			Ref<O.Option<NonEmptyArray<TypeOf<T['wrapped']>>>>,
			Ref<O.Option<NonEmptyArray<TypeOf<T['wrapped']>>>>,
			ExtractVariablesDefinition<T>
	  >
	: T extends OptionNode<any, any, any, any, any, any, any>
	? OptionNode<
			T['wrapped'],
			ExtractOptionNodeDataFromWrapped<T['wrapped']>,
			ExtractOptionNodePartialDataFromWrapped<T['wrapped']>,
			Ref<O.Option<O.Option<TypeOf<T['wrapped']>>>>,
			Ref<O.Option<O.Option<TypeOf<T['wrapped']>>>>,
			ExtractVariablesDefinition<T>
	  >
	: T extends MapNode<any, any, any, any, any, any, any, any>
	? MapNode<
			T['key'],
			T['wrapped'],
			ExtractMapNodeDataFromKeyValue<T['key'], T['wrapped']>,
			ExtractMapNodePartialDataFromKeyValue<T['key'], T['wrapped']>,
			Ref<O.Option<Map<TypeOf<T['key']>, TypeOf<T['wrapped']>>>>,
			Ref<O.Option<Map<TypeOf<T['key']>, TypeOf<T['wrapped']>>>>,
			ExtractVariablesDefinition<T>
	  >
	: T extends SumNode<any, any, any, any, any, any, any>
	? SumNode<
			T['members'],
			ExtractSumNodeDataFromMembers<T['members']>,
			ExtractSumNodePartialDataFromMembers<T['members']>,
			Ref<O.Option<TypeOf<T>>>,
			Ref<O.Option<TypeOf<T>>>,
			ExtractVariablesDefinition<T>
	  >
	: T

export function markAsEntity<T extends Node>(node: T): ExtractEntityType<T> {
	return {
		...node,
		__cache__: {
			...node.__cache__,
			isEntity: true
		}
	} as any
}

export function markAsLocal<T extends Node>(node: T): T {
	return {
		...node,
		__cache__: {
			...node.__cache__,
			isLocal: true
		}
	} as any
}

export function useCustomCache<T extends Node>(node: T, customCache: CustomCache<T>): T {
	return {
		...node,
		__cache__: {
			...node.__cache__,
			useCustomCache: customCache
		}
	}
}
