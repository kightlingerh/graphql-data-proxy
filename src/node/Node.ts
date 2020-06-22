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
	Ref,
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
	| SumNode<any, any, any>
	| ScalarNode<any, any, any, any>
	| MutationNode<any, any, any>

export type PrimitiveNode =
	| StringNode<any, any, any, any>
	| BooleanNode<any, any, any, any>
	| FloatNode<any, any, any, any>
	| IntNode<any, any, any, any>

export interface StringNode<
	Data = string,
	PartialData = string,
	RefsData = Ref<O.Option<string>>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables> {
	readonly tag: 'String'
}

export interface BooleanNode<
	Data = boolean,
	PartialData = boolean,
	RefsData = Ref<O.Option<boolean>>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables> {
	readonly tag: 'Boolean'
}

export interface IntNode<
	Data = number,
	PartialData = number,
	RefsData = Ref<O.Option<number>>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables> {
	readonly tag: 'Int'
}

export interface FloatNode<
	Data = number,
	PartialData = number,
	RefsData = Ref<O.Option<number>>,
	Variables extends NodeVariablesDefinition = {}
> extends NodeDefinition<Data, PartialData, RefsData, Variables> {
	readonly tag: 'Float'
}

export interface TypeNode<
	Typename extends string,
	Members extends { [K in keyof Members]: Node },
	Data = { [K in keyof Members]: TypeOf<Members[K]> },
	PartialData = Partial<{ [K in keyof Members]: TypeOfPartial<Members[K]> }>,
	RefsData = { [K in keyof Members]: TypeOfRefs<Members[K]> },
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {} & Intersection<
		Values<
			{
				[K in keyof Members]: ExtractChildrenVariablesDefinition<Members[K]> &
					ExtractVariablesDefinition<Members[K]>
			}
		>
	>
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

export interface ArrayNode<
	Wrapped extends Node,
	Data = Array<TypeOf<Wrapped>>,
	PartialData = Array<TypeOfPartial<Wrapped>>,
	RefsData = Ref<Array<TypeOfRefs<Wrapped>>>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {} & ExtractChildrenVariablesDefinition<Wrapped> &
		ExtractVariablesDefinition<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Array'
	readonly wrapped: Wrapped
}

export interface MapNode<
	Key extends Node,
	Value extends Node,
	Data = Map<TypeOf<Key>, TypeOf<Value>>,
	PartialData = Map<TypeOf<Key>, TypeOfPartial<Value>>,
	RefsData = Map<TypeOf<Key>, TypeOfRefs<Value>>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {} & ExtractChildrenVariablesDefinition<Value> &
		ExtractVariablesDefinition<Value>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Map'
	readonly key: Key
	readonly wrapped: Value
}

export interface OptionNode<
	Wrapped extends Node,
	Data = O.Option<TypeOf<Wrapped>>,
	PartialData = O.Option<TypeOfPartial<Wrapped>>,
	RefsData = Ref<O.Option<TypeOfRefs<Wrapped>>>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {} & ExtractChildrenVariablesDefinition<Wrapped> &
		ExtractVariablesDefinition<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Option'
	readonly wrapped: Wrapped
}

export interface NonEmptyArrayNode<
	Wrapped extends Node,
	Data = NonEmptyArray<TypeOf<Wrapped>>,
	PartialData = NonEmptyArray<TypeOfPartial<Wrapped>>,
	RefsData = Ref<O.Option<NonEmptyArray<TypeOfRefs<Wrapped>>>>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {} & ExtractChildrenVariablesDefinition<Wrapped> &
		ExtractVariablesDefinition<Wrapped>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'NonEmptyArray'
	readonly wrapped: Wrapped
}

type ExtractTypeName<T> = T extends TypeNode<infer A, any, any, any, any, any, any> ? A : never

export interface SumNode<
	Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>,
	Data = { [K in keyof Members]: TypeOf<Members[K]> & { __typename: ExtractTypeName<Members[K]> } }[number],
	PartialData = {
		[K in keyof Members]: TypeOfPartial<Members[K]> & { __typename?: ExtractTypeName<Members[K]> }
	}[number],
	RefsData = Ref<O.Option<{ [K in keyof Members]: TypeOfRefs<Members[K]> }[number]>>,
	Variables extends NodeVariablesDefinition = {},
	ChildrenVariables extends NodeVariablesDefinition = {} & Intersection<
		{
			[K in keyof Members]: ExtractChildrenVariablesDefinition<Members[K]> &
				ExtractVariablesDefinition<Members[K]>
		}[number]
	>
> extends NodeDefinition<Data, PartialData, RefsData, Variables, ChildrenVariables> {
	readonly tag: 'Sum'
	readonly members: Members
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
	RefsData = Ref<O.Option<Data>>,
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

export interface NodeCacheConfig {
	readonly isEntity?: boolean
	readonly uniqueBy?: string
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

function getVariablesModel<V extends NodeVariablesDefinition>(variables: V): M.Model<{ [K in keyof V]: TypeOf<V[K]> }> {
	return isEmptyObject(variables) ? (EMPTY_VARIABLES_MODEL as any) : M.type(variables)
}

export function int(): IntNode
export function int<V extends NodeVariablesDefinition>(variables: V): IntNode<number, number, Ref<O.Option<number>>, V>
export function int<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): IntNode<number, number, Ref<O.Option<number>>, V> {
	return {
		tag: 'Int',
		strictModel: M.number,
		partialModel: M.number,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: getVariablesModel(variables),
		print: constEmptyString
	}
}

export const staticInt = int()

export function float(): FloatNode
export function float<V extends NodeVariablesDefinition>(
	variables: V
): FloatNode<number, number, Ref<O.Option<number>>, V>
export function float<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): FloatNode<number, number, Ref<O.Option<number>>, V> {
	return {
		tag: 'Float',
		strictModel: M.number,
		partialModel: M.number,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: getVariablesModel(variables),
		print: constEmptyString
	}
}

export const staticFloat = float()

export function string(): StringNode
export function string<V extends NodeVariablesDefinition>(
	variables: V
): StringNode<string, string, Ref<O.Option<string>>, V>
export function string<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): StringNode<string, string, Ref<O.Option<string>>, V> {
	return {
		tag: 'String',
		strictModel: M.string,
		partialModel: M.string,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: getVariablesModel(variables),
		print: constEmptyString
	}
}

export const staticString = string()

export function boolean(): BooleanNode
export function boolean<V extends NodeVariablesDefinition>(
	variables: V
): BooleanNode<boolean, boolean, Ref<O.Option<boolean>>, V>
export function boolean<V extends NodeVariablesDefinition = {}>(
	variables: V = EMPTY_VARIABLES
): BooleanNode<boolean, boolean, Ref<O.Option<boolean>>, V> {
	return {
		tag: 'Boolean',
		strictModel: M.boolean,
		partialModel: M.boolean,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: getVariablesModel(variables),
		print: constEmptyString
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
): ScalarNode<Name, Data, Data, Ref<O.Option<Data>>, Variables>
export function scalar<Name extends string, Data, Variables extends NodeVariablesDefinition = {}>(
	name: Name,
	model: M.Model<Data>,
	variables: Variables = EMPTY_VARIABLES
): ScalarNode<Name, Data, Data, Ref<O.Option<Data>>, Variables> {
	return {
		name,
		tag: 'Scalar',
		strictModel: model,
		partialModel: model,
		childrenVariablesDefinition: EMPTY_VARIABLES,
		nodeVariablesDefinition: variables,
		variablesModel: getVariablesModel(variables),
		print: constEmptyString
	}
}

function extractTypeChildrenVariables<T extends { [K in keyof T]: Node }>(
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
	{ [K in keyof Members]: TypeOf<Members[K]> },
	Partial<{ [K in keyof Members]: TypeOfPartial<Members[K]> }>,
	{ [K in keyof Members]: TypeOfRefs<Members[K]> },
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
	{ [K in keyof Members]: TypeOf<Members[K]> },
	Partial<{ [K in keyof Members]: TypeOfPartial<Members[K]> }>,
	{ [K in keyof Members]: TypeOfRefs<Members[K]> },
	Variables
> {
	return {
		__typename,
		tag: 'Type',
		members,
		strictModel: M.type(extractTypeMemberStrictModels(members)) as any,
		partialModel: M.partial(extractTypeMemberPartialModels(members)) as any,
		variablesModel: getVariablesModel(variables),
		childrenVariablesDefinition: extractTypeChildrenVariables(members),
		nodeVariablesDefinition: variables,
		print: printTypeNodeMembers(members)
	}
}

export function schema<Name extends string, Members extends { [K in keyof T]: Node }>(
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

export function map<Key extends Node, Value extends Node>(key: Key, value: Value): MapNode<Key, Value>
export function map<Key extends Node, Value extends Node, Variables extends NodeVariablesDefinition>(
	key: Key,
	value: Value,
	variables: Variables
): MapNode<
	Key,
	Value,
	Map<TypeOf<Key>, TypeOf<Value>>,
	Map<TypeOf<Key>, TypeOfPartial<Value>>,
	Map<TypeOf<Key>, TypeOfRefs<Value>>,
	Variables
>
export function map<Key extends Node, Value extends Node, Variables extends NodeVariablesDefinition = {}>(
	key: Key,
	value: Value,
	variables: Variables = EMPTY_VARIABLES
): MapNode<
	Key,
	Value,
	Map<TypeOf<Key>, TypeOf<Value>>,
	Map<TypeOf<Key>, TypeOfPartial<Value>>,
	Map<TypeOf<Key>, TypeOfRefs<Value>>,
	Variables
> {
	return {
		tag: 'Map',
		strictModel: M.map(key.strictModel, value.strictModel),
		partialModel: M.map(key.strictModel, value.partialModel),
		childrenVariablesDefinition: mergeVariablesDefinitionWithChildren(value),
		nodeVariablesDefinition: variables,
		variablesModel: getVariablesModel(variables),
		key,
		wrapped: value,
		print: value.print
	}
}

export function array<Wrapped extends Node>(wrapped: Wrapped): ArrayNode<Wrapped>
export function array<Wrapped extends Node, Variables extends NodeVariablesDefinition>(
	wrapped: Wrapped,
	variables: Variables
): ArrayNode<Wrapped, Array<TypeOf<Wrapped>>, Array<TypeOfPartial<Wrapped>>, Ref<Array<TypeOfRefs<Wrapped>>>, Variables>
export function array<Wrapped extends Node, Variables extends NodeVariablesDefinition = {}>(
	wrapped: Wrapped,
	variables: Variables = EMPTY_VARIABLES
): ArrayNode<
	Wrapped,
	Array<TypeOf<Wrapped>>,
	Array<TypeOfPartial<Wrapped>>,
	Ref<Array<TypeOfRefs<Wrapped>>>,
	Variables
> {
	return {
		tag: 'Array',
		wrapped,
		strictModel: M.array(wrapped.strictModel),
		partialModel: M.array(wrapped.partialModel),
		childrenVariablesDefinition: mergeVariablesDefinitionWithChildren(wrapped),
		variablesModel: getVariablesModel(variables),
		nodeVariablesDefinition: variables,
		print: wrapped.print
	}
}

function getSumObject<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(...members: Members) {
	const m: any = {};
	members.forEach((member) => {
		m[member.__typename] = M.type({
			__typename: M.literal(member.__typename),
			...extractTypeMemberStrictModels(member.members)
		})
	});
	return m;
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

export function sum<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(...members: Members) {
	return <Variables extends NodeVariablesDefinition>(
		variables: Variables = EMPTY_VARIABLES
	): SumNode<
		Members,
		{ [K in keyof Members]: TypeOf<Members[K]> & { __typename: ExtractTypeName<Members[K]> } }[number],
		{
			[K in keyof Members]: TypeOfPartial<Members[K]> & { __typename?: ExtractTypeName<Members[K]> }
		}[number],
		Ref<O.Option<{ [K in keyof Members]: TypeOfRefs<Members[K]> }[number]>>,
		Variables
	> => {
		return {
			tag: 'Sum',
			strictModel: getSumModel(...members),
			partialModel: getSumPartialModel(...members),
			print: printSumNode(...members),
			nodeVariablesDefinition: variables,
			childrenVariablesDefinition: extractTypeChildrenVariables(getSumObject(...members)) as any,
			variablesModel: getVariablesModel(variables),
			members
		}
	}
}

export function option<Wrapped extends Node>(wrapped: Wrapped): OptionNode<Wrapped>
export function option<Wrapped extends Node, Variables extends NodeVariablesDefinition>(wrapped: Wrapped, variables: Variables): OptionNode<T, Variables>
export function option<Wrapped extends Node, Variables extends NodeVariablesDefinition = {}>(
	wrapped: T,
	variables: V = EMPTY_VARIABLES
): OptionNode<T, V> {
	return {
		tag: 'Option',
		wrapped,
		model: {
			whole: M.option(wrapped.model.whole),
			partial: M.option(wrapped.model.partial)
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(wrapped),
			model: getVariablesModel(variables),
			definition: variables
		},
		print: wrapped.print
	}
}

export function isOptionNode(u: Node): u is OptionNode<any> {
	return u.tag === 'Option'
}

export function nonEmptyArray<T extends Node>(wrapped: T): NonEmptyArrayNode<T>
export function nonEmptyArray<T extends Node, V extends NodeVariablesDefinition>(
	wrapped: T,
	variables: V
): NonEmptyArrayNode<T, V>
export function nonEmptyArray<T extends Node, V extends NodeVariablesDefinition = {}>(
	wrapped: T,
	variables: V = EMPTY_VARIABLES
): NonEmptyArrayNode<T, V> {
	return {
		tag: 'NonEmptyArray',
		wrapped,
		model: {
			whole: M.nonEmptyArray(wrapped.model.whole),
			partial: M.nonEmptyArray(wrapped.model.partial)
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(wrapped),
			definition: variables,
			model: getVariablesModel(variables)
		},
		print: wrapped.print
	}
}

export function isNonEmptyArrayNode(u: Node): u is NonEmptyArrayNode<any, any> {
	return u.tag === 'NonEmptyArray'
}

export function isWrappedNode(x: Node): x is WrappedNode {
	const tag = x.tag
	return tag === 'Map' || tag === 'Option' || tag === 'Array' || tag === 'NonEmptyArray'
}

export function mutation<T extends Node>(result: T): MutationNode<T>
export function mutation<T extends Node, V extends NodeVariablesDefinition>(result: T, variables: V): MutationNode<T, V>
export function mutation<T extends Node, V extends NodeVariablesDefinition = {}>(
	result: T,
	variables: V = EMPTY_VARIABLES
): MutationNode<T, V> {
	return {
		tag: 'Mutation',
		result: result,
		model: {
			whole: result.model.whole as TypeOf<T>,
			partial: result.model.partial as TypeOfPartial<T>
		},
		variables: {
			children: mergeVariablesDefinitionWithChildren(result),
			model: getVariablesModel(variables),
			definition: variables
		},
		print: result.print
	}
}

export function isMutationNode(u: Node): u is MutationNode<any, any> {
	return u.tag === 'Mutation'
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
	if (!isEmptyObject(schema.variables.children)) {
		tokens.push(printVariables(schema.variables.children))
	}
	tokens.push(OPEN_SPACE, schema.print())
	return tokens.join('')
}

export function pickFromType<T extends TypeNode<any, any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	...keys: P[]
): TypeNode<T['__typename'], Pick<T['members'], P>> {
	const n: any = {}
	keys.forEach((k) => {
		n[k] = node.members[k]
	})
	return type(node.__typename, n, node.variables.definition) as any
}

export function omitFromType<T extends TypeNode<any, any, any, any>, P extends keyof T['members']>(
	node: T,
	...keys: P[]
): TypeNode<T['__typename'], Omit<T['members'], P>, T['variables']['definition']> {
	const n: any = {}
	const members = node.members
	Object.keys(members).forEach((k) => {
		if (!keys.includes(k as P)) {
			n[k] = members[k as keyof T]
		}
	})
	return type(node.__typename, n, node.variables.definition) as any
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

export function useEq<T extends NodeDefinition<any, any, any, any, any>>(node: T, eq: Eq<TypeOf<T>>): T {
	return {
		...node,
		model: {
			...node.model,
			whole: M.useEq(node.model.whole, eq)
		}
	}
}

export function eqById<
	N extends string,
	T extends { [K in keyof T]: Node } & Record<'id', Node>,
	V extends NodeVariablesDefinition = {}
>(node: TypeNode<N, T, V>): TypeNode<N, T, V> {
	return {
		...node,
		model: {
			...node.model,
			whole: M.eqById(node.model.whole)
		}
	}
}

export function useEncoder<T extends NodeDefinition<any, any, any, any, any>>(node: T, encoder: Encoder<TypeOf<T>>): T {
	return {
		...node,
		model: {
			...node.model,
			whole: M.useEncoder(node.model.whole, encoder)
		}
	}
}

export function encodeById<
	Name extends string,
	Members extends { [K in keyof Members]: Node } & Record<'id', Node>,
	Variables extends NodeVariablesDefinition = {},
	Refs = { [K in keyof Members]: TypeOfRefs<Members[K]> }
>(node: TypeNode<Name, Members, Variables, Refs>): TypeNode<Name, Members, Variables, Refs> {
	return {
		...node,
		model: {
			...node.model,
			whole: M.useEncoder(node.model.whole, {
				encode: (a) => node.members.id.model.whole.encode(a.id)
			})
		}
	}
}

type ExtractEntityType<T extends Node> = T extends TypeNode<any, any, any, any>
	? TypeNode<T['__typename'], T['members'], ExtractVariablesDefinition<T>, Ref<O.Option<TypeOf<T>>>>
	: T extends SumNode<any, any, any>
	? SumNode<T['members'], ExtractVariablesDefinition<T>, Ref<O.Option<TypeOf<T>>>>
	: T extends ArrayNode<any, any, any>
	? ArrayNode<T['wrapped'], ExtractVariablesDefinition<T>, Ref<O.Option<TypeOf<T>>>>
	: T extends NonEmptyArrayNode<any, any, any>
	? NonEmptyArrayNode<T['wrapped'], ExtractVariablesDefinition<T>, Ref<O.Option<TypeOf<T>>>>
	: T extends OptionNode<any, any, any>
	? OptionNode<T['wrapped'], ExtractVariablesDefinition<T>, Ref<O.Option<TypeOf<T>>>>
	: T extends MapNode<any, any, any, any>
	? MapNode<T['key'], T['wrapped'], ExtractVariablesDefinition<T>, Ref<O.Option<TypeOf<T>>>>
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

export function markAsUnique<T extends TypeNode<any, any, any, any>>(node: T, uniqueBy: keyof T['members']): T {
	return {
		...node,
		__cache__: {
			...node.__cache__,
			uniqueBy
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
