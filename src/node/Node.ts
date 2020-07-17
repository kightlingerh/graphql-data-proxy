import { Eq } from 'fp-ts/lib/Eq'
import { Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { Show } from 'fp-ts/lib/Show'
import { Encoder } from 'io-ts/lib/Encoder'
import * as M from '../model/Model'
import {
	CLOSE_BRACKET,
	CLOSE_PAREN,
	COLON,
	constEmptyString,
	DOLLAR_SIGN,
	ELLIPSIS,
	EXCLAMATION,
	isEmptyObject,
	isEmptyString,
	ON,
	OPEN_BRACKET,
	OPEN_PAREN,
	OPEN_SPACE,
	TYPENAME
} from '../shared'

export type TypeOf<T> = T extends { readonly strictModel: M.Model<infer A> } ? A : never

export type TypeOfPartial<T> = T extends { readonly partialModel: M.Model<infer A> } ? A : never

export type TypeOfVariables<T> = ExtractDefinitionType<ExtractVariablesDefinition<T>>

export type TypeOfChildrenVariables<T> = ExtractDefinitionType<ExtractChildrenVariablesDefinition<T>>

export type TypeOfMergedVariables<T> = TypeOfVariables<T> & TypeOfChildrenVariables<T>

export type TypeOfRefs<T> = T extends { readonly __refs__?: infer A } ? A : never

export type Node =
	| PrimitiveNode
	| WrappedNode
	| TypeNode<any, any, any, any, any, any, any>
	| SumNode<any, any, any, any, any, any>
	| ScalarNode<any, any, any, any, any, any>
	| MutationNode<any, any, any, any, any, any>

export type PrimitiveNode =
	| StringNode<any, any, any, any>
	| BooleanNode<any, any, any, any>
	| FloatNode<any, any, any, any>
	| IntNode<any, any, any, any>

export interface StringNode<
	Data = string,
	PartialData = string,
	RefsData = O.Option<string>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables> {
	readonly tag: 'String'
}

export interface BooleanNode<
	Data = boolean,
	PartialData = boolean,
	RefsData = O.Option<boolean>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables> {
	readonly tag: 'Boolean'
}

export interface IntNode<
	Data = number,
	PartialData = number,
	RefsData = O.Option<number>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables> {
	readonly tag: 'Int'
}

export interface FloatNode<
	Data = number,
	PartialData = number,
	RefsData = O.Option<number>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables> {
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

export interface TypeNode<
	Typename extends string,
	Members extends { [K in keyof Members]: Node },
	Data = ExtractTypeNodeDataFromMembers<Members>,
	PartialData = ExtractTypeNodePartialDataFromMembers<Members>,
	RefsData = ExtractTypeNodeRefsFromMembers<Members>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractTypeNodeChildrenVariablesFromMembers<Members>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly __typename: Typename
	readonly tag: 'Type'
	readonly members: Members
}

export type SchemaNode<N extends string, T extends { [K in keyof T]: Node }> = TypeNode<N, T>

export type WrappedNode =
	| ArrayNode<any, any, any, any, any, any>
	| MapNode<any, any, any, any, any, any, any>
	| OptionNode<any, any, any, any, any, any>
	| NonEmptyArrayNode<any, any, any, any, any, any>

export type ExtractArrayNodeDataFromWrapped<Wrapped> = Array<TypeOf<Wrapped>>

export type ExtractArrayNodePartialDataFromWrapped<Wrapped> = Array<TypeOfPartial<Wrapped>>

export type ExtractArrayNodeRefsFromWrapped<Wrapped> = Array<TypeOfRefs<Wrapped>>

export type ExtractChildrenVariablesDefinitionFromWrapped<Wrapped> = {} & ExtractChildrenVariablesDefinition<Wrapped> &
	ExtractVariablesDefinition<Wrapped>

export interface ArrayNode<
	Wrapped extends Node,
	Data = ExtractArrayNodeDataFromWrapped<Wrapped>,
	PartialData = ExtractArrayNodePartialDataFromWrapped<Wrapped>,
	RefsData = ExtractArrayNodeRefsFromWrapped<Wrapped>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Array'
	readonly wrapped: Wrapped
}

export type ExtractMapNodeDataFromKeyValue<Key, Value> = Map<TypeOf<Key>, TypeOf<Value>>

export type ExtractMapNodePartialDataFromKeyValue<Key, Value> = Map<TypeOf<Key>, TypeOfPartial<Value>>

export type ExtractMapNodeRefsFromKeyValue<Key, Value> = Map<TypeOf<Key>, TypeOfRefs<Value>>

export interface MapNode<
	Key extends Node,
	Value extends Node,
	Data = ExtractMapNodeDataFromKeyValue<Key, Value>,
	PartialData = ExtractMapNodePartialDataFromKeyValue<Key, Value>,
	RefsData = ExtractMapNodeRefsFromKeyValue<Key, Value>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Value>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Map'
	readonly key: Key
	readonly wrapped: Value
}

export type ExtractOptionNodeDataFromWrapped<Wrapped> = O.Option<TypeOf<Wrapped>>

export type ExtractOptionNodePartialDataFromWrapped<Wrapped> = O.Option<TypeOfPartial<Wrapped>>

export type ExtractOptionNodeRefsFromWrapped<Wrapped> = O.Option<TypeOfRefs<Wrapped>>

export interface OptionNode<
	Wrapped extends Node,
	Data = ExtractOptionNodeDataFromWrapped<Wrapped>,
	PartialData = ExtractOptionNodePartialDataFromWrapped<Wrapped>,
	RefsData = ExtractOptionNodeRefsFromWrapped<Wrapped>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Option'
	readonly wrapped: Wrapped
}

export type ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped> = NonEmptyArray<TypeOf<Wrapped>>

export type ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped> = NonEmptyArray<TypeOfPartial<Wrapped>>

export type ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped> = O.Option<NonEmptyArray<TypeOfRefs<Wrapped>>>

export interface NonEmptyArrayNode<
	Wrapped extends Node,
	Data = ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped>,
	PartialData = ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped>,
	RefsData = ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'NonEmptyArray'
	readonly wrapped: Wrapped
}

type ExtractTypeName<T> = T extends TypeNode<infer A, any, any, any, any, any, any> ? A : never

export type ExtractSumNodeDataFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>
> = { [K in keyof Members]: TypeOf<Members[K]> & { __typename: ExtractTypeName<Members[K]> } }[number]

export type ExtractSumNodePartialDataFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>
> = {
	[K in keyof Members]: TypeOfPartial<Members[K]> & { __typename?: ExtractTypeName<Members[K]> }
}[number]

export type ExtractSumNodeRefsFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>
> = O.Option<{ [K in keyof Members]: TypeOfRefs<Members[K]> }[number]>

export type ExtractSumNodeChildrenVariablesDefinitionFromMembers<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>
> = {} & Intersection<
	{
		[K in keyof Members]: ExtractChildrenVariablesDefinition<Members[K]> & ExtractVariablesDefinition<Members[K]>
	}[number]
>

export interface SumNode<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>,
	Data = ExtractSumNodeDataFromMembers<Members>,
	PartialData = ExtractSumNodePartialDataFromMembers<Members>,
	RefsData = ExtractSumNodeRefsFromMembers<Members>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = ExtractSumNodeChildrenVariablesDefinitionFromMembers<Members>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Sum'
	readonly members: Members
	readonly membersRecord: Record<ExtractTypeName<{ [K in keyof Members]: Members[K] }[number]>, Members[number]>
}

export interface MutationNode<
	Result extends Node,
	Data = TypeOf<Node>,
	PartialData = TypeOfPartial<Node>,
	RefsData = TypeOfRefs<Result>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {} & ExtractChildrenVariablesDefinition<Result>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Mutation'
	readonly result: Result
}

export interface ScalarNode<
	Name extends string,
	Data,
	PartialData = Data,
	RefsData = O.Option<Data>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Scalar'
	readonly name: Name
}

interface NodeDefinition<
	StrictData,
	PartialData,
	RefsData,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {}
> {
	readonly tag: string
	readonly strictModel: M.Model<StrictData>
	readonly partialModel: M.Model<PartialData>
	readonly childrenVariablesDefinition: ChildrenVariables
	readonly nodeVariablesDefinition: Variables
	readonly variablesModel: M.Model<ExtractDefinitionType<Variables>>
	readonly print: Lazy<string>
	readonly __refs__?: RefsData
	readonly __cache__?: NodeCacheConfig
}

export type EncodedVariables = string

export type CacheEntry = any

export interface CacheNode extends Map<EncodedVariables, CacheEntry> {}

export interface CustomCache<T> {
	(
		schemaNode: T,
		requestNode: T,
		variables: TypeOfMergedVariables<T>,
		cacheNode: CacheNode,
		data?: TypeOfPartial<T>
	): TypeOfRefs<T>
}

export interface NodeCacheConfig<T = any> {
	readonly isEntity?: boolean
	readonly useCustomCache?: CustomCache<T>
}

export interface NodeVariablesDefinition {
	[K: string]: Node
}

export type ExtractVariablesDefinition<T> = T extends { readonly nodeVariablesDefinition: infer A } ? A : never

export type ExtractDefinitionType<V> = {
	[K in keyof V]: TypeOf<V[K]>
}

export type ExtractChildrenVariablesDefinition<T> = T extends { readonly childrenVariablesDefinition: infer A }
	? A
	: never

type Values<T> = T[keyof T]

type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

const EMPTY_VARIABLES_MODEL = M.type({})

const EMPTY_VARIABLES: any = {}

export function definitionToModel<V extends NodeVariablesDefinition>(
	variables: V
): M.Model<{ [K in keyof V]: TypeOf<V[K]> }> {
	return isEmptyObject(variables) ? (EMPTY_VARIABLES_MODEL as any) : M.type(extractTypeMemberStrictModels(variables))
}

export function int(): IntNode
export function int<V extends NodeVariablesDefinition>(variables: V): IntNode<number, number, O.Option<number>, V>
export function int<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): IntNode<number, number, O.Option<number>, V> {
	return {
		tag: 'Int',
		strictModel: M.number,
		partialModel: M.number,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: definitionToModel(variables),
		print: constEmptyString
	}
}

export const staticInt = int()

export function float(): FloatNode
export function float<V extends NodeVariablesDefinition>(variables: V): FloatNode<number, number, O.Option<number>, V>
export function float<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): FloatNode<number, number, O.Option<number>, V> {
	return {
		tag: 'Float',
		strictModel: M.number,
		partialModel: M.number,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: definitionToModel(variables),
		print: constEmptyString
	}
}

export const staticFloat = float()

export function string(): StringNode
export function string<V extends NodeVariablesDefinition>(variables: V): StringNode<string, string, O.Option<string>, V>
export function string<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): StringNode<string, string, O.Option<string>, V> {
	return {
		tag: 'String',
		strictModel: M.string,
		partialModel: M.string,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: definitionToModel(variables),
		print: constEmptyString
	}
}

export const staticString = string()

export function boolean(): BooleanNode
export function boolean<V extends NodeVariablesDefinition>(
	variables: V
): BooleanNode<boolean, boolean, O.Option<boolean>, V>
export function boolean<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): BooleanNode<boolean, boolean, O.Option<boolean>, V> {
	return {
		tag: 'Boolean',
		strictModel: M.boolean,
		partialModel: M.boolean,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: definitionToModel(variables),
		print: constEmptyString
	}
}

export const staticBoolean = boolean()

export function scalar<Name extends string, Data>(
	name: Name,
	model: M.Model<Data>
): ScalarNode<Name, Data, Data, O.Option<Data>>
export function scalar<Name extends string, Data, Variables extends NodeVariablesDefinition>(
	name: Name,
	model: M.Model<Data>,
	variables: Variables
): ScalarNode<Name, Data, Data, O.Option<Data>, Variables>
export function scalar<Name extends string, Data, Variables extends NodeVariablesDefinition = {}>(
	name: Name,
	model: M.Model<Data>,
	variables: Variables = EMPTY_VARIABLES
): ScalarNode<Name, Data, Data, O.Option<Data>, Variables> {
	return {
		name,
		tag: 'Scalar',
		strictModel: model,
		partialModel: model,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: definitionToModel(variables),
		print: constEmptyString
	}
}

function getTypeChildrenVariables<T extends { [K in keyof T]: Node }>(
	members: T
): {} & Intersection<
	Values<{ [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]> }>
> {
	const x: any = {}
	Object.keys(members).forEach((key) => {
		for (const [k, v] of Object.entries(members[key as keyof T].childrenVariablesDefinition)) {
			if (x[k] !== undefined) {
				console.warn(
					`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
				)
			}
			x[k] = v
		}

		for (const [k, v] of Object.entries(members[key as keyof T].nodeVariablesDefinition)) {
			if (x[k] !== undefined) {
				console.warn(
					`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
				)
			}
			x[k] = v
		}
	})
	return x
}

function extractTypeMemberStrictModels<Members extends { [K in keyof Members]: Node }>(
	members: Members
): { [K in keyof Members]: Members[K]['strictModel'] } {
	const x: any = {}
	Object.keys(members).forEach((key) => {
		x[key as keyof Members] = members[key as keyof Members].strictModel
	})
	return x
}

function extractTypeMemberPartialModels<Members extends { [K in keyof Members]: Node }>(
	members: Members
): { [K in keyof Members]: Members[K]['partialModel'] } {
	const x: any = {}
	Object.keys(members).forEach((key) => {
		x[key as keyof Members] = members[key as keyof Members].partialModel
	})
	return x
}

function printVariablesNode<V extends NodeVariablesDefinition>(variables: V): string {
	const tokens: string[] = [OPEN_PAREN]
	const keys = Object.keys(variables)
	const length = keys.length
	const last = length - 1
	let i = 0
	for (; i < length; i++) {
		const key = keys[i]
		tokens.push(key, COLON, OPEN_SPACE, DOLLAR_SIGN, key, i === last ? '' : ', ')
	}
	tokens.push(CLOSE_PAREN)
	return tokens.join('')
}

function printTypeNodeMembers(members: { [K: string]: Node }): Lazy<string> {
	return () => {
		const tokens: string[] = [OPEN_BRACKET, OPEN_SPACE]
		for (const [key, value] of Object.entries(members)) {
			tokens.push(key)
			if (!isEmptyObject(value.nodeVariablesDefinition)) {
				tokens.push(printVariablesNode(value.nodeVariablesDefinition))
			}
			const val = value.print()
			tokens.push(...(isEmptyString(val) ? [OPEN_SPACE] : [OPEN_SPACE, val, OPEN_SPACE]))
		}
		tokens.push(CLOSE_BRACKET)
		return tokens.join('')
	}
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
	Variables
> {
	return {
		__typename,
		tag: 'Type',
		members,
		strictModel: M.type(extractTypeMemberStrictModels(members)) as any,
		partialModel: M.partial(extractTypeMemberPartialModels(members)) as any,
		variablesModel: definitionToModel(variables),
		childrenVariablesDefinition: getTypeChildrenVariables(members),
		nodeVariablesDefinition: variables,
		print: printTypeNodeMembers(members)
	}
}

export function schema<Name extends string, Members extends { [K in keyof Members]: Node }>(
	__typename: Name,
	members: Members
): TypeNode<Name, Members> {
	return type(__typename, members)
}

function mergeVariablesDefinitionWithChildren<T extends Node>(
	node: T
): ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T> {
	const x: any = {}
	for (const [k, v] of Object.entries(node.childrenVariablesDefinition)) {
		if (x[k] !== undefined) {
			console.warn(
				`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
			)
		}
		x[k] = v
	}
	for (const [k, v] of Object.entries(node.nodeVariablesDefinition)) {
		if (x[k] !== undefined) {
			console.warn(
				`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
			)
		}
		x[k] = v
	}
	return x
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

function getSumModel<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(
	...members: Members
): M.Model<{ [K in keyof Members]: TypeOf<Members[K]> & { __typename: ExtractTypeName<Members[K]> } }[number]> {
	return M.sum('__typename')(getSumObject(...members))
}

function getSumPartialModel<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(
	...members: Members
): M.Model<{ [K in keyof Members]: TypeOfPartial<Members[K]> & { __typename?: ExtractTypeName<Members[K]> } }[number]> {
	return M.sum('__typename')(getSumObject(...members))
}

function printSumNode<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(
	...members: Members
): Lazy<string> {
	return () => {
		const tokens: string[] = [OPEN_BRACKET, TYPENAME]
		members.forEach((member) => {
			tokens.push(
				ELLIPSIS,
				OPEN_SPACE,
				ON,
				OPEN_SPACE,
				member.__typename,
				OPEN_SPACE,
				printTypeNodeMembers(member.members)()
			)
		})
		tokens.push(CLOSE_BRACKET)
		return tokens.join('')
	}
}

function getSumChildrenVariables<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(
	...members: Members
): ExtractSumNodeChildrenVariablesDefinitionFromMembers<Members> {
	const x: any = {}
	members.forEach((member) => {
		for (const [k, v] of Object.entries(member.childrenVariablesDefinition)) {
			if (x[k] !== undefined) {
				console.warn(
					`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
				)
			}
			x[k] = v
		}

		for (const [k, v] of Object.entries(member.nodeVariablesDefinition)) {
			if (x[k] !== undefined) {
				console.warn(
					`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
				)
			}
			x[k] = v
		}
	})
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
		Variables
	> => {
		const newMembers = members.map((member) =>
			member.members.hasOwnProperty('__typename')
				? member
				: type(
						member.__typename,
						{ ...member.members, __typename: scalar(member.__typename, M.literal(member.__typename)) },
						member.nodeVariablesDefinition
				  )
		)
		return {
			tag: 'Sum',
			strictModel: getSumModel(...newMembers),
			partialModel: getSumPartialModel(...newMembers),
			print: printSumNode(...members),
			nodeVariablesDefinition: variables,
			childrenVariablesDefinition: getSumChildrenVariables(...newMembers),
			variablesModel: definitionToModel(variables),
			membersRecord: getSumMembersRecord(...newMembers),
			members
		}
	}
}

export function map<Key extends Node, Value extends Node>(key: Key, value: Value): MapNode<Key, Value>
export function map<Key extends Node, Value extends Node, Variables extends NodeVariablesDefinition>(
	key: Key,
	value: Value,
	variables: Variables
): MapNode<
	Key,
	Value,
	ExtractMapNodeDataFromKeyValue<Key, Value>,
	ExtractMapNodePartialDataFromKeyValue<Key, Value>,
	ExtractMapNodeRefsFromKeyValue<Key, Value>,
	Variables
>
export function map<Key extends Node, Value extends Node, Variables extends NodeVariablesDefinition = {}>(
	key: Key,
	value: Value,
	variables: Variables = EMPTY_VARIABLES
): MapNode<
	Key,
	Value,
	ExtractMapNodeDataFromKeyValue<Key, Value>,
	ExtractMapNodePartialDataFromKeyValue<Key, Value>,
	ExtractMapNodeRefsFromKeyValue<Key, Value>,
	Variables
> {
	return {
		tag: 'Map',
		strictModel: M.map(key.strictModel, value.strictModel),
		partialModel: M.map(key.strictModel, value.partialModel),
		childrenVariablesDefinition: mergeVariablesDefinitionWithChildren(value),
		nodeVariablesDefinition: variables,
		variablesModel: definitionToModel(variables),
		key,
		wrapped: value,
		print: value.print
	}
}

export function array<Wrapped extends Node>(wrapped: Wrapped): ArrayNode<Wrapped>
export function array<Wrapped extends Node, Variables extends NodeVariablesDefinition>(
	wrapped: Wrapped,
	variables: Variables
): ArrayNode<
	Wrapped,
	ExtractArrayNodeDataFromWrapped<Wrapped>,
	ExtractArrayNodePartialDataFromWrapped<Wrapped>,
	ExtractArrayNodeRefsFromWrapped<Wrapped>,
	Variables
>
export function array<Wrapped extends Node, Variables extends NodeVariablesDefinition = {}>(
	wrapped: Wrapped,
	variables: Variables = EMPTY_VARIABLES
): ArrayNode<
	Wrapped,
	ExtractArrayNodeDataFromWrapped<Wrapped>,
	ExtractArrayNodePartialDataFromWrapped<Wrapped>,
	ExtractArrayNodeRefsFromWrapped<Wrapped>,
	Variables
> {
	return {
		tag: 'Array',
		wrapped,
		strictModel: M.array(wrapped.strictModel),
		partialModel: M.array(wrapped.partialModel),
		childrenVariablesDefinition: mergeVariablesDefinitionWithChildren(wrapped),
		variablesModel: definitionToModel(variables),
		nodeVariablesDefinition: variables,
		print: wrapped.print
	}
}

export function option<Wrapped extends Node>(wrapped: Wrapped): OptionNode<Wrapped>
export function option<Wrapped extends Node, Variables extends NodeVariablesDefinition>(
	wrapped: Wrapped,
	variables: Variables
): OptionNode<
	Wrapped,
	ExtractOptionNodeDataFromWrapped<Wrapped>,
	ExtractOptionNodePartialDataFromWrapped<Wrapped>,
	ExtractOptionNodeRefsFromWrapped<Wrapped>,
	Variables
>
export function option<Wrapped extends Node, Variables extends NodeVariablesDefinition = {}>(
	wrapped: Wrapped,
	variables: Variables = EMPTY_VARIABLES
): OptionNode<
	Wrapped,
	ExtractOptionNodeDataFromWrapped<Wrapped>,
	ExtractOptionNodePartialDataFromWrapped<Wrapped>,
	ExtractOptionNodeRefsFromWrapped<Wrapped>,
	Variables
> {
	return {
		tag: 'Option',
		wrapped,
		strictModel: M.option(wrapped.strictModel),
		partialModel: M.option(wrapped.partialModel),
		childrenVariablesDefinition: mergeVariablesDefinitionWithChildren(wrapped),
		variablesModel: definitionToModel(variables),
		nodeVariablesDefinition: variables,
		print: wrapped.print
	}
}

export function nonEmptyArray<Wrapped extends Node>(wrapped: Wrapped): NonEmptyArrayNode<Wrapped>
export function nonEmptyArray<Wrapped extends Node, Variables extends NodeVariablesDefinition>(
	wrapped: Wrapped,
	variables: Variables
): NonEmptyArrayNode<
	Wrapped,
	ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped>,
	Variables
>
export function nonEmptyArray<Wrapped extends Node, Variables extends NodeVariablesDefinition = {}>(
	wrapped: Wrapped,
	variables: Variables = EMPTY_VARIABLES
): NonEmptyArrayNode<
	Wrapped,
	ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped>,
	ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped>,
	Variables
> {
	return {
		tag: 'NonEmptyArray',
		wrapped,
		strictModel: M.nonEmptyArray(wrapped.strictModel),
		partialModel: M.nonEmptyArray(wrapped.partialModel),
		childrenVariablesDefinition: mergeVariablesDefinitionWithChildren(wrapped),
		variablesModel: definitionToModel(variables),
		nodeVariablesDefinition: variables,
		print: wrapped.print
	}
}

export function mutation<Result extends Node>(result: Result): MutationNode<Result>
export function mutation<Result extends Node, Variables extends NodeVariablesDefinition>(
	result: Result,
	variables: Variables
): MutationNode<Result, TypeOf<Result>, TypeOfPartial<Result>, TypeOfRefs<Result>, Variables>
export function mutation<Result extends Node, Variables extends NodeVariablesDefinition = {}>(
	result: Result,
	variables: Variables = EMPTY_VARIABLES
): MutationNode<Result, TypeOf<Result>, TypeOfPartial<Result>, TypeOfRefs<Result>, Variables> {
	return {
		tag: 'Mutation',
		result: result,
		strictModel: result.strictModel,
		partialModel: result.partialModel,
		childrenVariablesDefinition: mergeVariablesDefinitionWithChildren(result),
		variablesModel: definitionToModel(variables),
		nodeVariablesDefinition: variables,
		print: result.print
	}
}

function printVariables<V extends NodeVariablesDefinition>(variables: V): string {
	const tokens: string[] = [OPEN_PAREN]
	const keys = Object.keys(variables)
	const length = keys.length
	const last = length - 1
	let i = 0
	for (; i < length; i++) {
		const key = keys[i]
		tokens.push(DOLLAR_SIGN, key, COLON, OPEN_SPACE, printVariableName(variables[key]), i === last ? '' : ', ')
	}
	tokens.push(CLOSE_PAREN)
	return tokens.join('')
}

function isOptionNode(node: Node): node is OptionNode<any> {
	return node.tag === 'Option'
}

function printVariableName(node: Node, isOptional: boolean = false): string {
	const optionalString = isOptional ? '' : EXCLAMATION
	switch (node.tag) {
		case 'Array':
		case 'NonEmptyArray':
			return `[${printVariableName(node.wrapped, isOptionNode(node.wrapped))}]${optionalString}`
		case 'Map':
			return `Map[${printVariableName(node.key)}, ${printVariableName(
				node.wrapped,
				isOptionNode(node.wrapped)
			)}]${optionalString}`
		case 'Option':
			return printVariableName(node.wrapped, true)
		case 'Boolean':
		case 'String':
		case 'Int':
		case 'Float':
			return `${node.tag}${optionalString}`
		case 'Scalar':
			return `${node.name}${optionalString}`
		case 'Type':
			return `${node.__typename}${optionalString}`
		default:
			return ''
	}
}

export function print<N extends string, T extends { [K in keyof T]: Node }>(
	schema: SchemaNode<N, T>,
	operation: string,
	operationName: string
): string {
	const tokens = [operation, ' ', operationName]
	if (!isEmptyObject(schema.nodeVariablesDefinition)) {
		tokens.push(printVariables(schema.nodeVariablesDefinition))
	}
	tokens.push(OPEN_SPACE, schema.print())
	return tokens.join('')
}

export function pickFromType<T extends TypeNode<any, any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	...keys: P[]
): TypeNode<
	T['__typename'],
	Pick<T['members'], P>,
	ExtractTypeNodeDataFromMembers<Pick<T['members'], P>>,
	ExtractTypeNodePartialDataFromMembers<Pick<T['members'], P>>,
	ExtractTypeNodeRefsFromMembers<Pick<T['members'], P>>,
	ExtractVariablesDefinition<T>
> {
	const n: any = {}
	keys.forEach((k) => {
		n[k] = node.members[k]
	})
	return type(node.__typename, n, node.nodeVariablesDefinition) as any
}

export function omitFromType<T extends TypeNode<any, any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	...keys: P[]
): TypeNode<
	T['__typename'],
	Omit<T['members'], P>,
	ExtractTypeNodeDataFromMembers<Omit<T['members'], P>>,
	ExtractTypeNodePartialDataFromMembers<Omit<T['members'], P>>,
	ExtractTypeNodeRefsFromMembers<Omit<T['members'], P>>,
	ExtractVariablesDefinition<T>
> {
	const n: any = {}
	const members = node.members
	Object.keys(members).forEach((k) => {
		if (!keys.includes(k as P)) {
			n[k] = members[k as keyof T]
		}
	})
	return type(node.__typename, n, node.nodeVariablesDefinition) as any
}

export function useEq<T extends NodeDefinition<any, any, any, any, any>>(node: T, eq: Eq<TypeOf<T>>): T {
	return {
		...node,
		strictModel: M.useEq(node.strictModel, eq)
	}
}

export function eqById<T extends TypeNode<any, Record<'id', Node>, any, any, any, any, any>>(node: T): T {
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

export function encodeById<T extends TypeNode<any, Record<'id', Node>, any, any, any, any, any>>(node: T): T
export function encodeById<
	T extends SumNode<ReadonlyArray<TypeNode<any, Record<'id', Node>, any, any, any, any, any>>>
>(node: T): T
export function encodeById<
	T extends
		| TypeNode<any, Record<'id', Node>, any, any, any, any, any>
		| SumNode<ReadonlyArray<TypeNode<any, Record<'id', Node>, any, any, any, any, any>>>
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

type ExtractEntityType<T extends Node> = T extends TypeNode<any, any, any, any, any, any, any>
	? TypeNode<
			T['__typename'],
			T['members'],
			ExtractTypeNodeDataFromMembers<T['members']>,
			ExtractTypeNodePartialDataFromMembers<T['members']>,
			O.Option<TypeOf<T>>,
			ExtractVariablesDefinition<T>
	  >
	: T extends ArrayNode<any, any, any, any, any, any>
	? ArrayNode<
			T['wrapped'],
			ExtractArrayNodeDataFromWrapped<T['wrapped']>,
			ExtractArrayNodePartialDataFromWrapped<T['wrapped']>,
			O.Option<TypeOf<T>[]>,
			ExtractVariablesDefinition<T>
	  >
	: T extends NonEmptyArrayNode<any, any, any, any, any, any>
	? NonEmptyArrayNode<
			T['wrapped'],
			ExtractNonEmptyArrayNodeDataFromWrapped<T['wrapped']>,
			ExtractNonEmptyArrayNodePartialDataFromWrapped<T['wrapped']>,
			O.Option<NonEmptyArray<TypeOf<T>>>,
			ExtractVariablesDefinition<T>
	  >
	: T extends OptionNode<any, any, any, any, any, any>
	? OptionNode<
			T['wrapped'],
			ExtractOptionNodeDataFromWrapped<T['wrapped']>,
			ExtractOptionNodePartialDataFromWrapped<T['wrapped']>,
			O.Option<TypeOf<T>>,
			ExtractVariablesDefinition<T>
	  >
	: T extends MapNode<any, any, any, any, any, any, any>
	? MapNode<
			T['key'],
			T['wrapped'],
			ExtractMapNodeDataFromKeyValue<T['key'], T['wrapped']>,
			ExtractMapNodePartialDataFromKeyValue<T['key'], T['wrapped']>,
			O.Option<Map<TypeOf<T['key']>, TypeOf<T['wrapped']>>>,
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

export function useCustomCache<T extends Node>(node: T, customCache: CustomCache<T>): T {
	return {
		...node,
		__cache__: {
			...node.__cache__,
			useCustomCache: customCache
		}
	}
}

export const showNode: Show<Node> = {
	show: (node) => {
		switch (node.tag) {
			case 'Boolean':
			case 'Int':
			case 'Float':
			case 'String':
				return node.tag
			case 'Scalar':
				return `Scalar: ${node.name}`
			case 'Map':
				return `Map<${showNode.show(node.key)}, ${showNode.show(node.wrapped)}>`
			case 'Option':
				return `Option<${showNode.show(node.wrapped)}>`
			case 'Array':
				return `Array<${showNode.show(node.wrapped)}`
			case 'NonEmptyArray':
				return `NonEmptyArray<${showNode.show(node.wrapped)}`
			case 'Sum':
				return showSumNode.show(node)
			case 'Type':
				return showTypeNode.show(node)
			default:
				return node.tag
		}
	}
}

export const showSumNode: Show<SumNode<any>> = {
	show: (node) =>
		`{ ${Object.keys(node.members)
			.map((k) => `${k}: ${node.members[k].__typename}`)
			.join(', ')} }`
}

export const showTypeNode: Show<TypeNode<string, any, any>> = {
	show: (node) =>
		`{ ${Object.keys(node.members)
			.map((k) =>
				`${k}: ${node.members[k].tag} ${node.members[k].__typename || node.members[k].name || ''}`.trimEnd()
			)
			.join(', ')} }`
}
