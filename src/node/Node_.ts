import * as O from 'fp-ts/Option'
import { Float, Int } from '../model/Guard'
import * as M from '../model/Model'
import { isEmptyObject } from '../shared/index'
import {
	CacheNode,
	ExtractTypeNodeCacheEntryFromMembers,
	ExtractTypeNodeChildrenVariablesFromMembers,
	ExtractTypeNodeDataFromMembers,
	ExtractTypeNodePartialDataFromMembers,
	ExtractTypeNodeRefsFromMembers,
	getDefinitionModel,
	NodeVariablesDefinition
} from './Node'

export type TypeOf<T> = T extends BaseNode<any, any, infer A, any, any, any, any, any, any> ? A : never

export type TypeOfStrictInput<T> = T extends BaseNode<infer A, any, any, any, any, any, any, any, any> ? A : never

export type TypeOfStrictOutput<T> = T extends BaseNode<any, infer A, any, any, any, any, any, any, any> ? A : never

export type TypeOfPartial<T> = T extends BaseNode<any, any, any, any, any, infer A, any, any, any> ? A : never

export type TypeOfPartialInput<T> = T extends BaseNode<any, any, any, infer A, any, any, any, any, any> ? A : never

export type TypeOfPartialOutput<T> = T extends BaseNode<any, any, any, any, infer A, any, any, any, any> ? A : never

export type ExtractVariablesDefinition<T> = T extends BaseNode<any, any, any, any, any, any, any, infer V, any>
	? V
	: never

export type TypeOfVariables<T> = T extends BaseNode<any, any, any, any, any, any, any, infer V, any>
	? {
			[K in keyof V]: TypeOf<V[K]>
	  }
	: never

export type ExtractSubVariablesDefinition<T> = T extends BaseNode<any, any, any, any, any, any, any, any, infer V>
	? V
	: never

export type TypeOfSubVariables<T> = T extends BaseNode<any, any, any, any, any, any, any, any, infer V>
	? {
			[K in keyof V]: TypeOf<V[K]>
	  }
	: never

export type TypeOfCacheEntry<T> = T extends BaseNode<any, any, any, any, any, any, infer A, any, any> ? A : never

export type TypeOfMergedVariables<T> = TypeOfSubVariables<T> & TypeOfVariables<T>

export type Node = BaseNode<any, any, any, any, any, any, any, any, any>

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
	readonly __transformations: {
		readonly decoding: boolean
		readonly encoding: boolean
	}
	readonly __isLocal?: boolean
	readonly __isEntity?: boolean
	readonly __customCache?: CustomCache<
		PartialData,
		{ [K in keyof SubVariables]: M.TypeOf<SubVariables[K]> } & { [K in keyof Variables]: M.TypeOf<Variables[K]> },
		CacheEntry
	>
}

export interface StaticNodeConfig<PartialData, CacheEntry, SubVariables extends NodeVariables = {}, IsLocal extends boolean = false> {
	readonly variables?: Record<string, Node>
	readonly isLocal?: IsLocal
	readonly isEntity?: boolean
	readonly useCustomCache?: CustomCache<
		PartialData,
		{ [K in keyof SubVariables]: M.TypeOf<SubVariables[K]> },
		CacheEntry
	>
}

export interface DynamicNodeConfig<
	Variables extends NodeVariables,
	PartialData,
	CacheEntry,
	SubVariables extends NodeVariables = {},
	IsLocal extends boolean = false
> extends StaticNodeConfig<PartialData, CacheEntry, SubVariables, IsLocal> {
	readonly variables: Variables
}

export type NodeVariables = Record<string, Node>

export type Path = Array<string | number>

export interface CustomCache<PartialData, Variables extends Record<string, unknown>, CacheEntry> {
	(path: Path, variables: Variables, data?: PartialData): O.Option<CacheEntry>
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

type OutputFromLocal<IsLocal, Output> = IsLocal extends true ? undefined : Output;

export interface StringNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false>
	extends BaseNode<string, OutputFromLocal<IsLocal, string>, string, string, OutputFromLocal<IsLocal, string>, string, string | undefined, Variables> {
	readonly tag: 'String'
}

export interface StaticStringNodeConfig extends StaticNodeConfig<string, string | undefined> {}

export interface DynamicStringNodeConfig<Variables extends NodeVariables>
	extends DynamicNodeConfig<Variables, string, string | undefined> {}

export function string<IsLocal extends boolean = false>(config?: StaticStringNodeConfig): StringNode
export function string<V extends NodeVariables>(config: DynamicStringNodeConfig<V>): StringNode<V>
export function string<V extends NodeVariables = {}>(
	config?: StaticStringNodeConfig | DynamicStringNodeConfig<V>
): StringNode<V> {
	return {
		tag: STRING_TAG,
		strict: M.string,
		partial: M.string,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__transformations: NO_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export const staticString = string()

type t = TypeOfVariables<typeof staticString>

export interface BooleanNode<Variables extends NodeVariables = {}>
	extends BaseNode<boolean, boolean, boolean, boolean, boolean, boolean, boolean | undefined, Variables> {
	readonly tag: 'Boolean'
}

const BOOLEAN_TAG = 'Boolean'

export function boolean(): BooleanNode
export function boolean<V extends NodeVariables>(variables: V): BooleanNode<NodeVariables>
export function boolean<V extends NodeVariables = {}>(variables: V = EMPTY_VARIABLES): BooleanNode<V> {
	return {
		tag: BOOLEAN_TAG,
		models: {
			strict: M.boolean,
			partial: M.boolean,
			variables: fromDefinition(variables)
		},
		definitions: {
			variables,
			subVariables: EMPTY_VARIABLES,
			mergedVariables: variables
		},
		__transformations: NO_TRANSFORMATIONS
	}
}

export const staticBoolean = boolean()

export interface IntNode<Variables extends NodeVariables = {}>
	extends BaseNode<number, number, Int, number, number, Int, Int | undefined, Variables> {
	readonly tag: 'Int'
}

const INT_TAG = 'Int'

export function int(): IntNode
export function int<V extends NodeVariables>(variables: V): IntNode<NodeVariables>
export function int<V extends NodeVariables = {}>(variables: V = EMPTY_VARIABLES): IntNode<V> {
	return {
		tag: INT_TAG,
		models: {
			strict: M.int,
			partial: M.int,
			variables: fromDefinition(variables)
		},
		definitions: {
			variables,
			subVariables: EMPTY_VARIABLES,
			mergedVariables: variables
		},
		__transformations: NO_TRANSFORMATIONS
	}
}

export const staticInt = int()

export interface FloatNode<Variables extends NodeVariables = {}>
	extends BaseNode<number, number, Float, number, number, Float, Float | undefined, Variables> {
	readonly tag: 'Float'
}

const FLOAT_TAG = 'Float'

export function float(): FloatNode
export function float<V extends NodeVariables>(variables: V): FloatNode<NodeVariables>
export function float<V extends NodeVariables = {}>(variables: V = EMPTY_VARIABLES): FloatNode<V> {
	return {
		tag: FLOAT_TAG,
		models: {
			strict: M.float,
			partial: M.float,
			variables: fromDefinition(variables)
		},
		definitions: {
			variables,
			subVariables: EMPTY_VARIABLES,
			mergedVariables: variables
		},
		__transformations: NO_TRANSFORMATIONS
	}
}

export const staticFloat = float()

export interface ScalarNode<Name extends string, I, O, A, Variables extends NodeVariables = {}>
	extends BaseNode<I, O, A, I, O, A, A | undefined, Variables> {
	readonly tag: 'Scalar'
	readonly name: Name
}

const SCALAR_TAG = 'Scalar'

export function scalar<Name extends string, I, O, A>(name: Name, model: M.Model<I, O, A>): ScalarNode<Name, I, O, A>
export function scalar<Name extends string, I, O, A, V extends NodeVariables>(
	name: Name,
	model: M.Model<I, O, A>,
	variables: V
): ScalarNode<Name, I, O, A, V>
export function scalar<Name extends string, I, O, A, V extends NodeVariables = {}>(
	name: Name,
	model: M.Model<I, O, A>,
	variables: V = EMPTY_VARIABLES
): ScalarNode<Name, I, O, A, V> {
	return {
		tag: SCALAR_TAG,
		name,
		models: {
			strict: model,
			partial: model,
			variables: fromDefinition(variables)
		},
		definitions: {
			variables,
			subVariables: EMPTY_VARIABLES,
			mergedVariables: variables
		},
		__transformations: NO_TRANSFORMATIONS
	}
}

type Values<T> = T[keyof T]

type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

function mergeNodeVariables<T extends Node>(
	node: T
): {} & ExtractSubVariablesDefinition<T> & ExtractVariablesDefinition<T> {
	if (__DEV__) {
		for (const k in node.definitions.variables) {
			if (node.definitions.subVariables[k] !== undefined) {
				console.warn(
					`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`
				)
			}
		}
	}
	return Object.assign(Object.create(null), node.definitions.subVariables, node.definitions.variables)
}

function mergeTypeNodeSubVariables<T extends Record<string, Node>>(
	members: T
): {} & Intersection<
	Values<{ [K in keyof T]: ExtractSubVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]> }>
> {
	const entries = []
	for (const k in members) {
		entries.push(mergeNodeVariables(members[k]))
	}
	return Object.assign(Object.create(null), entries)
}

export type ExtractTypeNodeStrictDataFromMembers<MS extends Record<string, Node>> = { [K in keyof MS]: TypeOf<MS[K]> }

export type ExtractTypeNodeStrictInputFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]: TypeOfStrictInput<MS[K]>
}

export type ExtractTypeNodeStrictOutputFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]: TypeOfStrictOutput<MS[K]>
}

export type ExtractTypeNodePartialDataFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]: TypeOfPartial<MS[K]>
}

export type ExtractTypeNodePartialInputFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]: TypeOfPartialInput<MS[K]>
}

export type ExtractTypeNodePartialOutputFromMembers<MS extends Record<string, Node>> = {
	[K in keyof MS]: TypeOfPartialOutput<MS[K]>
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

interface BaseTypeNode<Typename extends string, MS extends Record<string, Node>, Variables extends NodeVariables = {}>
	extends BaseNode<
		ExtractTypeNodeStrictInputFromMembers<MS>,
		ExtractTypeNodeStrictOutputFromMembers<MS>,
		ExtractTypeNodeStrictDataFromMembers<MS>,
		ExtractTypeNodePartialInputFromMembers<MS>,
		ExtractTypeNodePartialOutputFromMembers<MS>,
		ExtractTypeNodePartialDataFromMembers<MS>,
		ExtractTypeNodeCacheEntryFromMembers<MS>,
		Variables,
		ExtractTypeNodeSubVariablesFromMembers<MS>
	> {
	readonly __typename: Typename
	readonly tag: 'Type'
	readonly members: MS
}

type TypeNode<
	Typename extends string,
	MS extends Record<string, Node>,
	Variables extends NodeVariables = {},
	IncludeTypename extends boolean = false
> = IncludeTypename extends true
	? BaseTypeNode<Typename, MS & { __typename: TypenameNode<Typename> }, Variables>
	: BaseTypeNode<Typename, MS, Variables>
