import { Model } from '../model';
import { ArrayNode, array } from './Array';
import { BooleanNode, boolean } from './Boolean';
import { FloatNode, float } from './Float';
import { IntNode, int } from './Int';
import { MapNode, map } from './Map';
import { MutationNode, mutation } from './Mutation';
import { NonEmptyArrayNode, nonEmptyArray } from './NonEmptyArray';
import { OptionNode, option } from './Option';
import { ScalarNode, scalar } from './Scalar';
import { SchemaNode, schema } from './Schema';
import { ExtractMergedVariablesDefinition, NodeVariables, TypeOf, TypeOfStrictInput, TypeOfStrictOutput } from './shared';
import { StringNode, string } from './String';
import { SumNode, sum } from './Sum';
import { TypeNode, type } from './Type';
export declare type Node = ArrayNode<any, any, any> | BooleanNode<any, any> | FloatNode<any, any> | IntNode<any, any> | MapNode<any, any, any, any, any, any, any, any> | MutationNode<any, any, any> | NonEmptyArrayNode<any, any, any> | OptionNode<any, any, any> | ScalarNode<any, any, any, any, any, any> | SchemaNode<any, any> | StringNode<any, any> | SumNode<any, any, any> | TypeNode<any, any, any, any>;
export declare type NodeTag = Node['tag'];
export declare const node: {
    array: typeof array;
    boolean: typeof boolean;
    staticBoolean: BooleanNode<{}, false>;
    float: typeof float;
    staticFloat: FloatNode<{}, false>;
    int: typeof int;
    staticInt: IntNode<{}, false>;
    map: typeof map;
    mutation: typeof mutation;
    nonEmptyArray: typeof nonEmptyArray;
    option: typeof option;
    scalar: typeof scalar;
    schema: typeof schema;
    string: typeof string;
    staticString: StringNode<{}, false>;
    sum: typeof sum;
    type: typeof type;
};
export declare function useMergedVariables<N extends Node>(node: N): ExtractMergedVariablesDefinition<N>;
export declare function useVariablesModel<V extends NodeVariables>(variables: V): Model<{
    [K in keyof V]: TypeOfStrictInput<V[K]>;
}, {
    [K in keyof V]: TypeOfStrictOutput<V[K]>;
}, {
    [K in keyof V]: TypeOf<V[K]>;
}>;
export declare function useMergedVariablesModel<N extends Node>(node: N): Model<{
    [K in keyof ExtractMergedVariablesDefinition<N>]: TypeOfStrictInput<ExtractMergedVariablesDefinition<N>[K]>;
}, {
    [K in keyof ExtractMergedVariablesDefinition<N>]: TypeOfStrictOutput<ExtractMergedVariablesDefinition<N>[K]>;
}, {
    [K in keyof ExtractMergedVariablesDefinition<N>]: TypeOf<ExtractMergedVariablesDefinition<N>[K]>;
}>;
