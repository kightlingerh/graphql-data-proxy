import { fromType, Model } from '../model'
import { isEmptyObject } from '../shared'
import { ArrayNode, array } from './Array'
import { BooleanNode, boolean, staticBoolean } from './Boolean'
import { FloatNode, float, staticFloat } from './Float'
import { IntNode, int, staticInt } from './Int'
import { MapNode, map, recordMap, tupleMap } from './Map'
import { MutationNode, mutation } from './Mutation'
import { NonEmptyArrayNode, nonEmptyArray } from './NonEmptyArray'
import { OptionNode, option } from './Option'
import { ScalarNode, scalar } from './Scalar'
import { SchemaNode, schema } from './Schema'
import { SetNode, set } from './Set'
import {
	ExtractMergedVariablesDefinition,
	NodeVariables,
	TypeOf,
	TypeOfStrictInput,
	TypeOfStrictOutput
} from './shared'
import { StringNode, string, staticString } from './String'
import { SumNode, sum } from './Sum'
import { TypeNode, type } from './Type'

export type Node =
	| ArrayNode<any, any, any>
	| BooleanNode<any, any>
	| FloatNode<any, any>
	| IntNode<any, any>
	| MapNode<any, any, any, any, any, any, any, any>
	| MutationNode<any, any, any>
	| NonEmptyArrayNode<any, any, any>
	| OptionNode<any, any, any>
	| ScalarNode<any, any, any, any, any, any>
	| SchemaNode<any, any>
	| SetNode<any, any, any>
	| StringNode<any, any>
	| SumNode<any, any, any>
	| TypeNode<any, any, any, any>

export type NodeTag = Node['tag']

export const node = {
	array,
	boolean,
	staticBoolean,
	float,
	staticFloat,
	int,
	staticInt,
	map,
	recordMap,
	tupleMap,
	mutation,
	nonEmptyArray,
	option,
	scalar,
	schema,
	set,
	string,
	staticString,
	sum,
	type
}

function mergeVariables(node: Node, variables: Record<string, Node>[]) {
	if (!isEmptyObject(node.variables)) {
		variables.push(node.variables)
	}
	switch (node.tag) {
		case 'Type':
			for (const value of Object.values<Node>(node.members)) {
				mergeVariables(value, variables)
			}
			break
		case 'Array':
		case 'NonEmptyArray':
		case 'Set':
		case 'Option':
		case 'Map':
			mergeVariables(node.item, variables)
			break
		case 'Mutation':
			mergeVariables(node.result, variables)
			break
		case 'Sum':
			node.members.forEach((member: Node) => mergeVariables(member, variables))
			break
	}
}

export function useMergedVariables<N extends Node>(node: N): ExtractMergedVariablesDefinition<N> {
	const definitions: Record<string, Node>[] = []
	mergeVariables(node, definitions) // collect variable definitions and then merge in one go
	return Object.assign(Object.create(null), ...definitions.reverse()) // reverse so that parent node variables overwrite child node variables
}

export function useVariablesModel<V extends NodeVariables>(
	variables: V
): Model<
	{ [K in keyof V]: TypeOfStrictInput<V[K]> },
	{ [K in keyof V]: TypeOfStrictOutput<V[K]> },
	{ [K in keyof V]: TypeOf<V[K]> }
> {
	const x = Object.create(null)
	for (const [key, value] of Object.entries(variables)) {
		x[key] = value.strict
	}
	return fromType(x) as any
}

export function useMergedVariablesModel<N extends Node>(
	node: N
): Model<
	{ [K in keyof ExtractMergedVariablesDefinition<N>]: TypeOfStrictInput<ExtractMergedVariablesDefinition<N>[K]> },
	{ [K in keyof ExtractMergedVariablesDefinition<N>]: TypeOfStrictOutput<ExtractMergedVariablesDefinition<N>[K]> },
	{ [K in keyof ExtractMergedVariablesDefinition<N>]: TypeOf<ExtractMergedVariablesDefinition<N>[K]> }
> {
	return useVariablesModel(useMergedVariables(node))
}
