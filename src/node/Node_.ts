import { ArrayNode, array } from './Array';
import { BooleanNode, boolean, staticBoolean } from './Boolean';
import { FloatNode, float, staticFloat } from './Float';
import { IntNode, int, staticInt  } from './Int';
import { MapNode, map, recordMap, tupleMap } from './Map';
import { MutationNode, mutation } from './Mutation';
import { NonEmptyArrayNode, nonEmptyArray } from './NonEmptyArray';
import { OptionNode, option } from './Option';
import { ScalarNode, scalar } from './Scalar';
import { SchemaNode, schema } from './Schema';
import { SetNode, set } from './Set';
import { StringNode, string, staticString } from './String';
import { SumNode, sum } from './Sum';
import { TypeNode, type } from './Type';

export type Node = ArrayNode<any, any, any>
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

export type NodeTag = Node['tag'];

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
