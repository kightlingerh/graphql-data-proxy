import { Lazy } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { Option } from 'fp-ts/lib/Option';
import { Show } from 'fp-ts/lib/Show';
import * as M from '../model/Model';
import { Ref } from '../shared';
export interface DocumentNode<M, P, R, V extends VariablesNode = {}, MV extends VariablesNode = {}> {
    readonly tag: string;
    readonly variables: DocumentVariables<V, MV>;
    readonly model: DocumentModel<M, P, R>;
    readonly print: Lazy<string>;
}
interface DocumentVariables<V extends VariablesNode = {}, MV extends VariablesNode = {}> {
    __children?: MV;
    definition: V;
    model: M.Model<ExtractDefinitionType<V>>;
}
interface DocumentModel<W, P, R> {
    whole: M.Model<W>;
    partial: M.Model<P>;
    __ref?: R;
}
export declare type Node = PrimativeNode<any> | TypeNode<any, any, any> | WrappedNode<any> | SumNode<any, any> | ScalarNode<string, any, any> | MutationNode<any, any>;
export declare type PrimativeNode<V extends VariablesNode = {}> = StringNode<V> | BooleanNode<V> | NumberNode<V>;
export interface StringNode<V extends VariablesNode = {}> extends DocumentNode<string, string, Ref<string>, V> {
    readonly tag: 'String';
}
export interface BooleanNode<V extends VariablesNode = {}> extends DocumentNode<boolean, boolean, Ref<boolean>, V> {
    readonly tag: 'Boolean';
}
export interface NumberNode<V extends VariablesNode = {}> extends DocumentNode<number, number, Ref<number>, V> {
    readonly tag: 'Number';
}
export interface TypeNode<N extends string, T extends {
    [K in keyof T]: Node;
}, V extends VariablesNode = {}> extends DocumentNode<{
    [K in keyof T]: ExtractModelType<T[K]>;
}, Partial<{
    [K in keyof T]: ExtractModelType<T[K]>;
}>, Ref<{
    [K in keyof T]: ExtractRefType<T[K]>;
}>, V, {} & Intersection<Values<{
    [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]>;
}>>> {
    readonly __typename: N;
    readonly tag: 'Type';
    readonly members: T;
}
export declare type WrappedNode<T extends Node> = ArrayNode<T, any> | MapNode<T, any, any> | OptionNode<T, any> | NonEmptyArrayNode<T, any>;
export interface ArrayNode<T extends Node, V extends VariablesNode = {}> extends DocumentNode<ExtractModelType<T>[], ExtractPartialModelType<T>[], Ref<ExtractRefType<T>[]>, V, {} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>> {
    readonly tag: 'Array';
    readonly wrapped: T;
}
export interface MapNode<K extends Node, T extends Node, V extends VariablesNode = {}> extends DocumentNode<Map<ExtractModelType<K>, ExtractModelType<T>>, Map<ExtractModelType<K>, ExtractPartialModelType<T>>, Ref<Map<unknown, ExtractRefType<T>>>, V, {} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>> {
    readonly tag: 'Map';
    readonly key: K;
    readonly wrapped: T;
}
export interface OptionNode<T extends Node, V extends VariablesNode = {}> extends DocumentNode<Option<ExtractModelType<T>>, Option<ExtractPartialModelType<T>>, Ref<Option<ExtractRefType<T>>>, V, {} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>> {
    readonly tag: 'Option';
    readonly wrapped: T;
}
export interface NonEmptyArrayNode<T extends Node, V extends VariablesNode = {}> extends DocumentNode<NonEmptyArray<ExtractModelType<T>>, NonEmptyArray<ExtractPartialModelType<T>>, Ref<NonEmptyArray<ExtractRefType<T>>>, V, {} & ExtractChildrenVariablesDefinition<T> & ExtractVariablesDefinition<T>> {
    readonly tag: 'NonEmptyArray';
    readonly wrapped: T;
}
export interface SumNode<T extends {
    [K in keyof T]: TypeNode<any, any, any>;
}, V extends VariablesNode = {}> extends DocumentNode<{
    [K in keyof T]: ExtractModelType<T[K]>;
}[keyof T], {
    [K in keyof T]: ExtractPartialModelType<T[K]>;
}[keyof T], Ref<{
    [K in keyof T]: ExtractRefType<T[K]>;
}[keyof T]>, V, {} & Intersection<Values<{
    [K in keyof T]: ExtractChildrenVariablesDefinition<T[K]> & ExtractVariablesDefinition<T[K]>;
}>>> {
    readonly tag: 'Sum';
    readonly members: T;
}
export interface MutationNode<T extends Node, V extends VariablesNode = {}> extends DocumentNode<ExtractModelType<T>, ExtractPartialModelType<T>, ExtractRefType<T>, V, {} & ExtractChildrenVariablesDefinition<T>> {
    readonly tag: 'Mutation';
    readonly result: T;
}
export interface ScalarNode<N extends string, T, V extends VariablesNode = {}> extends DocumentNode<T, T, Ref<T>, V> {
    readonly tag: 'Scalar';
    readonly name: N;
}
export declare type ExtractRefType<T> = T extends {
    readonly model: DocumentModel<any, any, infer A>;
} ? A : never;
export declare type ExtractModelType<T> = T extends {
    readonly model: DocumentModel<infer A, any, any>;
} ? A : never;
export declare type ExtractPartialModelType<T> = T extends {
    readonly model: DocumentModel<any, infer A, any>;
} ? A : never;
export declare type ExtractChildrenVariablesType<T> = T extends {
    readonly variables: DocumentVariables<any, infer A>;
} ? ExtractDefinitionType<A> : never;
export declare type ExtractChildrenVariablesDefinition<T> = T extends {
    readonly variables: DocumentVariables<any, infer A>;
} ? A : never;
export declare type Values<T> = T[keyof T];
export declare type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never;
export interface VariablesNode {
    [K: string]: Node;
}
export declare type ExtractVariablesType<T> = T extends {
    readonly variables: DocumentVariables<infer A, any>;
} ? ExtractDefinitionType<A> : never;
export declare type ExtractVariablesDefinition<T> = T extends {
    readonly variables: DocumentVariables<infer A, any>;
} ? A : never;
export declare type ExtractDefinitionType<V> = {
    [K in keyof V]: ExtractModelType<V[K]>;
};
export declare const showNode: Show<Node>;
export declare const showSumNode: Show<SumNode<any>>;
export declare const showTypeNode: Show<TypeNode<string, any, any>>;
export declare const EMPTY_VARIABLES_MODEL: M.Model<unknown>;
export declare function getVariablesModel<V extends VariablesNode>(variables: V): M.Model<{
    [K in keyof V]: ExtractModelType<V[K]>;
}>;
export declare const EMPTY_VARIABLES: any;
export declare function number(): NumberNode;
export declare function number<V extends VariablesNode>(variables: V): NumberNode<V>;
export declare const staticNumber: NumberNode<{}>;
export declare function isNumberNode(u: Node): u is NumberNode;
export declare function string(): StringNode;
export declare function string<V extends VariablesNode>(variables: V): StringNode<V>;
export declare const staticString: StringNode<{}>;
export declare function isStringNode(u: Node): u is StringNode;
export declare function boolean(): BooleanNode;
export declare function boolean<V extends VariablesNode>(variables: V): BooleanNode<V>;
export declare const staticBoolean: BooleanNode<{}>;
export declare function isBooleanNode(u: Node): u is BooleanNode;
export declare function isLiteralNode(u: Node): u is PrimativeNode;
export declare function type<N extends string, T extends {
    [K in keyof T]: Node;
}>(__typename: N, members: T): TypeNode<N, T>;
export declare function type<N extends string, T extends {
    [K in keyof T]: Node;
}, V extends VariablesNode>(__typename: N, members: T, variables: V): TypeNode<N, T, V>;
export declare function isTypeNode(u: Node): u is TypeNode<any, any, any>;
export declare function map<K extends Node, T extends Node>(key: K, value: T): MapNode<K, T, {}>;
export declare function map<K extends Node, T extends Node, V extends VariablesNode>(key: K, value: T, variables: V): MapNode<K, T, V>;
export declare function isMapNode(u: Node): u is MapNode<any, any>;
export declare function array<T extends Node>(node: T): ArrayNode<T>;
export declare function array<T extends Node, V extends VariablesNode>(node: T, variables: V): ArrayNode<T, V>;
export declare function isArrayNode(u: Node): u is ArrayNode<any>;
export declare function sum<T extends {
    [K in keyof T]: TypeNode<string, any>;
}>(members: T): SumNode<T>;
export declare function sum<T extends {
    [K in keyof T]: TypeNode<string, any>;
}, V extends VariablesNode>(members: T, variables: V): SumNode<T, V>;
export declare function isSumNode(x: Node): x is SumNode<any, any>;
export declare function option<T extends Node>(node: T): OptionNode<T>;
export declare function option<T extends Node, V extends VariablesNode>(node: T, variables: V): OptionNode<T, V>;
export declare function isOptionNode(u: Node): u is OptionNode<any>;
export declare function nonEmptyArray<T extends Node>(node: T): NonEmptyArrayNode<T>;
export declare function nonEmptyArray<T extends Node, V extends VariablesNode>(node: T, variables: V): NonEmptyArrayNode<T, V>;
export declare function isWrappedNode(x: Node): x is WrappedNode<any>;
export declare function scalar<N extends string, T>(name: N, model: M.Model<T>): ScalarNode<N, T>;
export declare function scalar<N extends string, T, V extends VariablesNode>(name: N, model: M.Model<T>, variables: V): ScalarNode<N, T, V>;
export declare function isScalarNode(x: Node): x is ScalarNode<string, any>;
export {};
