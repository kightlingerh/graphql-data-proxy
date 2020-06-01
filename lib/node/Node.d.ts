import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as O from 'fp-ts/lib/Option';
import { Reader } from 'fp-ts/lib/Reader';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { Tree } from 'fp-ts/lib/Tree';
import * as D from '../document/DocumentNode';
import * as M from '../model/Model';
import { Ref } from '../shared';
export declare type TypeOf<T> = D.ExtractModelType<T>;
export declare type Node = PrimitiveNode<any> | TypeNode<any, any, any> | WrappedNode | SumNode<any, any> | ScalarNode<any, any, any> | MutationNode<any>;
export declare type PrimitiveNode<V extends D.VariablesNode = {}> = StringNode<V> | BooleanNode<V> | NumberNode<V>;
export interface StringNode<V extends D.VariablesNode = {}> extends MergeProxy<D.StringNode<V>> {
}
export interface BooleanNode<V extends D.VariablesNode = {}> extends MergeProxy<D.BooleanNode<V>> {
}
export interface NumberNode<V extends D.VariablesNode = {}> extends MergeProxy<D.NumberNode<V>> {
}
export interface TypeNode<N extends string, T extends {
    [K in keyof T]: Node;
}, V extends D.VariablesNode = {}> extends MergeProxy<D.TypeNode<N, T, V>> {
}
export declare type WrappedNode = ArrayNode<any, any> | MapNode<any, any, any> | OptionNode<any, any> | NonEmptyArrayNode<any, any>;
export interface ArrayNode<T extends Node, V extends D.VariablesNode = {}> extends MergeProxy<D.ArrayNode<T, V>> {
}
export interface MapNode<K extends Node, T extends Node, V extends D.VariablesNode = {}> extends MergeProxy<D.MapNode<K, T, V>> {
}
export interface OptionNode<T extends Node, V extends D.VariablesNode = {}> extends MergeProxy<D.OptionNode<T, V>> {
}
export interface NonEmptyArrayNode<T extends Node, V extends D.VariablesNode = {}> extends MergeProxy<D.NonEmptyArrayNode<T, V>> {
}
export interface SumNode<T extends {
    [K in keyof T]: TypeNode<string, any>;
}, V extends D.VariablesNode = {}> extends MergeProxy<D.SumNode<T, V>> {
}
export interface MutationNode<T extends Node, V extends D.VariablesNode = {}> extends MergeProxy<D.MutationNode<T, V>> {
}
export interface ScalarNode<N extends string, T, V extends D.VariablesNode = {}> extends MergeProxy<D.ScalarNode<N, T, V>> {
}
export declare type MergeProxy<T extends D.Node = D.Node> = T & Proxy<T>;
export interface Proxy<T> {
    readonly data: Reader<DataProxyDependencies<T>, DataProxy<T>>;
    readonly store: Reader<StoreProxyDependencies<T>, StoreProxy<T>>;
}
export interface DataProxy<N> {
    write(variables: ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheWriteResult>;
    read(selection: ExtractSelection<N>): Reader<ExtractMergedVariablesType<N>, CacheResult<O.Option<D.ExtractModelType<N>>>>;
    toRefs(selection: ExtractSelection<N>): Reader<ExtractMergedVariablesType<N>, CacheResult<D.ExtractRefType<N>>>;
    toRef(selection: ExtractSelection<N>): Reader<ExtractMergedVariablesType<N>, CacheResult<Ref<D.ExtractModelType<N>>>>;
}
export interface StoreProxy<N> {
    write(variables: ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheWriteResult>;
    read(selection: ExtractSelection<N>): Reader<ExtractMergedVariablesType<N>, CacheResult<O.Option<D.ExtractModelType<N>>>>;
    toRefs(selection: ExtractSelection<N>): Reader<ExtractMergedVariablesType<N>, CacheResult<D.ExtractRefType<N>>>;
    toRef(selection: ExtractSelection<N>): Reader<ExtractMergedVariablesType<N>, CacheResult<Ref<D.ExtractModelType<N>>>>;
}
export declare type ExtractSelection<T> = T extends D.TypeNode<string, any> ? D.TypeNode<string, any> : T extends D.ArrayNode<any> ? D.ArrayNode<any> : T extends D.MapNode<any, any> ? D.MapNode<any, any> : T extends D.NonEmptyArrayNode<any> ? D.NonEmptyArrayNode<any> : T extends D.OptionNode<any> ? D.OptionNode<any> : T extends D.SumNode<any, any> ? D.SumNode<any, any> : never;
export interface CacheWriteResult extends CacheResult<Evict> {
}
export interface CacheResult<T> extends TE.TaskEither<CacheError, T> {
}
export interface Evict extends T.Task<void> {
}
export interface CacheError extends NonEmptyArray<Tree<string>> {
}
export declare type ExtractMergedVariablesType<S> = S extends D.Node ? keyof D.ExtractChildrenVariablesDefinition<S> extends never ? D.ExtractVariablesType<S> : D.ExtractVariablesType<S> & D.ExtractChildrenVariablesType<S> : never;
interface DataProxyDependencies<T> extends CacheNodeDependencies {
    node?: T;
}
interface StoreProxyDependencies<T> extends CacheNodeDependencies {
    data?: Reader<DataProxyDependencies<T>, DataProxy<T>>;
    node?: T;
}
export interface CacheNodeDependencies {
    path: string;
    ofRef: OfRef;
    persist?: Persist;
}
export interface OfRef {
    <T>(value?: T): Ref<T>;
}
export interface Persist {
    store(key: string, value: string): TE.TaskEither<CacheError, void>;
    restore<T>(key: string): TE.TaskEither<CacheError, O.Option<T>>;
}
export declare type ExtractDataProxyType<T> = T extends MergeProxy<infer A> ? DataProxy<A> : never;
export declare type ExtractStoreProxyType<T> = T extends MergeProxy<infer A> ? StoreProxy<A> : never;
export declare function number(): NumberNode;
export declare function number<V extends D.VariablesNode>(variables: V): NumberNode<V>;
export declare const staticNumber: NumberNode<{}>;
export declare function string(): StringNode;
export declare function string<V extends D.VariablesNode>(variables: V): StringNode<V>;
export declare const staticString: StringNode<{}>;
export declare function boolean(): BooleanNode;
export declare function boolean<V extends D.VariablesNode>(variables: V): BooleanNode<V>;
export declare const staticBoolean: BooleanNode<{}>;
export declare function scalar<N extends string, T>(name: N, model: M.Model<T>): ScalarNode<N, T>;
export declare function scalar<N extends string, T, V extends D.VariablesNode>(name: N, model: M.Model<T>, variables: V): ScalarNode<N, T, V>;
export declare function type<N extends string, T extends {
    [K in keyof T]: Node;
}>(__typename: N, members: T): TypeNode<N, T>;
export declare function type<N extends string, T extends {
    [K in keyof T]: Node;
}, V extends D.VariablesNode>(__typename: N, members: T, variables: V): TypeNode<N, T, V>;
export declare function map<K extends Node, T extends Node>(key: K, value: T): MapNode<K, T>;
export declare function map<K extends Node, T extends Node, V extends D.VariablesNode>(key: K, value: T, variables: V): MapNode<K, T, V>;
export declare function array<T extends Node>(wrapped: T): ArrayNode<T>;
export declare function array<T extends Node, V extends D.VariablesNode>(wrapped: T, variables: V): ArrayNode<T, V>;
export declare function sum<T extends {
    [K in keyof T]: TypeNode<any, any, any>;
}>(members: T): SumNode<T>;
export declare function sum<T extends {
    [K in keyof T]: TypeNode<any, any, any>;
}, V extends D.VariablesNode>(members: T, variables: V): SumNode<T, V>;
export declare function option<T extends Node>(wrapped: T): OptionNode<T>;
export declare function option<T extends Node, V extends D.VariablesNode>(wrapped: T, variables: V): OptionNode<T, V>;
export declare function nonEmptyArray<T extends Node>(wrapped: T): MergeProxy<D.NonEmptyArrayNode<T>>;
export declare function nonEmptyArray<T extends Node, V extends D.VariablesNode>(wrapped: T, variables: V): MergeProxy<D.NonEmptyArrayNode<T, V>>;
export {};
