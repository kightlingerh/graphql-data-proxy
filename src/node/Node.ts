import { ArrayNode } from './Array'
import { BooleanNode } from './Boolean'
import { FloatNode } from './Float'
import { IntNode } from './Int'
import { MapNode } from './Map'
import { MutationNode } from './Mutation'
import { NonEmptyArrayNode } from './NonEmptyArray'
import { OptionNode } from './Option'
import { ScalarNode } from './Scalar'
import { SchemaNode } from './Schema'
import { StringNode } from './String'
import { SumNode } from './Sum'
import { TypeNode } from './Type'

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
	| StringNode<any, any>
	| SumNode<any, any, any>
	| TypeNode<any, any, any, any>

export type NodeTag = Node['tag']
