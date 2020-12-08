import { Eq } from 'fp-ts/lib/Eq';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as O from 'fp-ts/lib/Option';
import { Encoder } from 'io-ts/lib/Encoder';
import { Ref } from 'vue';
import * as M from '../model/Model';
export declare type TypeOf<T> = T extends {
    readonly strictModel: M.Model<infer A>;
} ? A : never;
export declare type TypeOfPartial<T> = T extends {
    readonly partialModel: M.Model<infer A>;
} ? A : never;
export declare type TypeOfVariables<T> = ExtractDefinitionType<ExtractVariablesDefinition<T>>;
export declare type TypeOfChildrenVariables<T> = ExtractDefinitionType<ExtractChildrenVariablesDefinition<T>>;
export declare type TypeOfMergedVariables<T> = TypeOfVariables<T> & TypeOfChildrenVariables<T>;
export declare type TypeOfRefs<T> = T extends {
    readonly __refs__?: infer A;
} ? A : never;
export declare type TypeOfCacheEntry<T> = T extends {
    readonly __cache_entry__?: infer A;
} ? A : never;
export declare type Node<Variables extends {} = any> = PrimitiveNode<Variables> | WrappedNode<Variables> | TypeNode<any, any, any, any, any, any, Variables, any> | SumNode<any, any, any, any, any, Variables, any> | ScalarNode<any, any, any, any, any, Variables, any> | MutationNode<any, any, any, any, any, Variables, any>;
export declare type PrimitiveNode<Variables extends {} = {}> = StringNode<any, any, any, Variables, any> | BooleanNode<any, any, any, Variables, any> | FloatNode<any, any, any, Variables, any> | IntNode<any, any, any, Variables, any>;
export interface StringNode<Data = string, PartialData = string, RefsData = Ref<O.Option<string>>, CacheEntry = Ref<O.Option<string>>, Variables extends NodeVariablesDefinition = {}> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables> {
    readonly tag: 'String';
}
export interface BooleanNode<Data = boolean, PartialData = boolean, RefsData = Ref<O.Option<boolean>>, CacheEntry = Ref<O.Option<boolean>>, Variables extends NodeVariablesDefinition = {}> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables> {
    readonly tag: 'Boolean';
}
export interface IntNode<Data = number, PartialData = number, RefsData = Ref<O.Option<number>>, CacheEntry = Ref<O.Option<number>>, Variables extends NodeVariablesDefinition = {}> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables> {
    readonly tag: 'Int';
}
export interface FloatNode<Data = number, PartialData = number, RefsData = Ref<O.Option<number>>, CacheEntry = Ref<O.Option<number>>, Variables extends NodeVariablesDefinition = {}> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables> {
    readonly tag: 'Float';
}
export declare type ExtractTypeNodeDataFromMembers<Members> = {
    [K in keyof Members]: TypeOf<Members[K]>;
};
export declare type ExtractTypeNodePartialDataFromMembers<Members> = Partial<{
    [K in keyof Members]: TypeOfPartial<Members[K]>;
}>;
export declare type ExtractTypeNodeRefsFromMembers<Members> = {
    [K in keyof Members]: TypeOfRefs<Members[K]>;
};
export declare type ExtractTypeNodeChildrenVariablesFromMembers<Members> = {} & Intersection<Values<{
    [K in keyof Members]: ExtractChildrenVariablesDefinition<Members[K]> & ExtractVariablesDefinition<Members[K]>;
}>>;
export declare type ExtractTypeNodeCacheEntryFromMembers<Members> = {
    [K in keyof Members]: ExtractVariablesDefinition<Members[K]> extends NonEmptyObject<ExtractVariablesDefinition<Members[K]>> ? CacheNode<TypeOfCacheEntry<Members[K]>> : TypeOfCacheEntry<Members[K]>;
};
declare type NonEmptyObject<T> = keyof T extends never ? never : T;
export interface TypeNode<Typename extends string, Members extends {
    [K in keyof Members]: Node;
}, Data = ExtractTypeNodeDataFromMembers<Members>, PartialData = ExtractTypeNodePartialDataFromMembers<Members>, RefsData = ExtractTypeNodeRefsFromMembers<Members>, CacheEntry = ExtractTypeNodeCacheEntryFromMembers<Members>, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = ExtractTypeNodeChildrenVariablesFromMembers<Members>> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
    readonly __typename: Typename;
    readonly tag: 'Type';
    readonly members: Members;
}
export declare type SchemaNode<N extends string, T extends {
    [K in keyof T]: Node;
}> = TypeNode<N, T>;
export declare type WrappedNode<Variables extends {} = {}> = ArrayNode<any, any, any, any, any, Variables, any> | MapNode<any, any, any, any, any, any, Variables, any> | OptionNode<any, any, any, any, any, Variables, any> | NonEmptyArrayNode<any, any, any, any, any, Variables, any>;
export declare type ExtractArrayNodeDataFromWrapped<Wrapped> = Array<TypeOf<Wrapped>>;
export declare type ExtractArrayNodePartialDataFromWrapped<Wrapped> = Array<TypeOfPartial<Wrapped>>;
export declare type ExtractArrayNodeRefsFromWrapped<Wrapped> = Ref<Array<TypeOfRefs<Wrapped>>>;
export declare type ExtractChildrenVariablesDefinitionFromWrapped<Wrapped> = {} & ExtractChildrenVariablesDefinition<Wrapped> & ExtractVariablesDefinition<Wrapped>;
export declare type ExtractArrayNodeCacheEntryFromWrapped<Wrapped> = Ref<Array<TypeOfCacheEntry<Wrapped>>>;
export interface ArrayNode<Wrapped extends Node, Data = ExtractArrayNodeDataFromWrapped<Wrapped>, PartialData = ExtractArrayNodePartialDataFromWrapped<Wrapped>, RefsData = ExtractArrayNodeRefsFromWrapped<Wrapped>, CacheEntry = ExtractArrayNodeCacheEntryFromWrapped<Wrapped>, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
    readonly tag: 'Array';
    readonly wrapped: Wrapped;
}
export declare type ExtractMapNodeDataFromKeyValue<Key, Value> = Map<TypeOf<Key>, TypeOf<Value>>;
export declare type ExtractMapNodePartialDataFromKeyValue<Key, Value> = Map<TypeOf<Key>, TypeOfPartial<Value>>;
export declare type ExtractMapNodeRefsFromKeyValue<Key, Value> = Ref<Map<TypeOf<Key>, TypeOfRefs<Value>>>;
export declare type ExtractMapNodeCacheEntryFromKeyValue<Key, Value> = Ref<Map<TypeOf<Key>, TypeOfCacheEntry<Value>>>;
export interface MapNode<Key extends Node, Value extends Node, Data = ExtractMapNodeDataFromKeyValue<Key, Value>, PartialData = ExtractMapNodePartialDataFromKeyValue<Key, Value>, RefsData = ExtractMapNodeRefsFromKeyValue<Key, Value>, CacheEntry = ExtractMapNodeCacheEntryFromKeyValue<Key, Value>, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Value>> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
    readonly tag: 'Map';
    readonly key: Key;
    readonly wrapped: Value;
}
export declare type ExtractOptionNodeDataFromWrapped<Wrapped> = O.Option<TypeOf<Wrapped>>;
export declare type ExtractOptionNodePartialDataFromWrapped<Wrapped> = O.Option<TypeOfPartial<Wrapped>>;
export declare type ExtractOptionNodeRefsFromWrapped<Wrapped> = Ref<O.Option<TypeOfRefs<Wrapped>>>;
export declare type ExtractOptionNodeCacheEntryFromWrapped<Wrapped> = Ref<O.Option<TypeOfCacheEntry<Wrapped>>>;
export interface OptionNode<Wrapped extends Node, Data = ExtractOptionNodeDataFromWrapped<Wrapped>, PartialData = ExtractOptionNodePartialDataFromWrapped<Wrapped>, RefsData = ExtractOptionNodeRefsFromWrapped<Wrapped>, CacheEntry = ExtractOptionNodeCacheEntryFromWrapped<Wrapped>, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
    readonly tag: 'Option';
    readonly wrapped: Wrapped;
}
export declare type ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped> = NonEmptyArray<TypeOf<Wrapped>>;
export declare type ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped> = NonEmptyArray<TypeOfPartial<Wrapped>>;
export declare type ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped> = Ref<O.Option<NonEmptyArray<TypeOfRefs<Wrapped>>>>;
export declare type ExtractNonEmptyArrayNodeCacheEntryFromWrapped<Wrapped> = Ref<O.Option<NonEmptyArray<TypeOfCacheEntry<Wrapped>>>>;
export interface NonEmptyArrayNode<Wrapped extends Node, Data = ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped>, PartialData = ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped>, RefsData = ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped>, CacheEntry = ExtractNonEmptyArrayNodeCacheEntryFromWrapped<Wrapped>, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = ExtractChildrenVariablesDefinitionFromWrapped<Wrapped>> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
    readonly tag: 'NonEmptyArray';
    readonly wrapped: Wrapped;
}
declare type ExtractTypeName<T> = T extends TypeNode<infer A, any, any, any, any, any, any, any> ? A : never;
export declare type ExtractSumNodeDataFromMembers<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>> = {
    [K in keyof Members]: TypeOf<Members[K]> & {
        __typename: ExtractTypeName<Members[K]>;
    };
}[number];
export declare type ExtractSumNodePartialDataFromMembers<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>> = {
    [K in keyof Members]: TypeOfPartial<Members[K]> & {
        __typename?: ExtractTypeName<Members[K]>;
    };
}[number];
export declare type ExtractSumNodeRefsFromMembers<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>> = Ref<O.Option<{
    [K in keyof Members]: TypeOfRefs<Members[K]>;
}[number]>>;
export declare type ExtractSumNodeChildrenVariablesDefinitionFromMembers<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>> = {} & Intersection<{
    [K in keyof Members]: ExtractChildrenVariablesDefinition<Members[K]> & ExtractVariablesDefinition<Members[K]>;
}[number]>;
export declare type ExtractSumNodeCacheEntryFromMembers<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>> = {
    [K in keyof Members]: Ref<O.Option<[ExtractTypeName<Members[K]>, TypeOfCacheEntry<Members[K]>]>>;
}[number];
export interface SumNode<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any, any>>, Data = ExtractSumNodeDataFromMembers<Members>, PartialData = ExtractSumNodePartialDataFromMembers<Members>, RefsData = ExtractSumNodeRefsFromMembers<Members>, CacheEntry = ExtractSumNodeCacheEntryFromMembers<Members>, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = ExtractSumNodeChildrenVariablesDefinitionFromMembers<Members>> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
    readonly tag: 'Sum';
    readonly members: Members;
    readonly membersRecord: Record<ExtractTypeName<{
        [K in keyof Members]: Members[K];
    }[number]>, Members[number]>;
}
export interface MutationNode<Result extends Node, Data = TypeOf<Node>, PartialData = TypeOfPartial<Node>, RefsData = TypeOfRefs<Result>, CacheEntry = TypeOfCacheEntry<Result>, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = {} & ExtractChildrenVariablesDefinition<Result>> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
    readonly tag: 'Mutation';
    readonly result: Result;
}
export interface ScalarNode<Name extends string, Data, PartialData = Data, RefsData = Ref<O.Option<Data>>, CacheEntry = Ref<O.Option<Data>>, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = {}> extends NodeDefinition<Data, PartialData, RefsData, CacheEntry, Variables, ChildrenVariables> {
    readonly tag: 'Scalar';
    readonly name: Name;
}
interface NodeDefinition<StrictData, PartialData, RefsData, CacheEntry, Variables extends NodeVariablesDefinition = {}, ChildrenVariables extends NodeVariablesDefinition = {}> {
    readonly tag: string;
    readonly strictModel: M.Model<StrictData>;
    readonly partialModel: M.Model<PartialData>;
    readonly variablesModel: M.Model<ExtractDefinitionType<Variables>>;
    readonly __sub_variables_definition__: ChildrenVariables;
    readonly __variables_definition__: Variables;
    readonly __cache_entry__?: CacheEntry;
    readonly __refs__?: RefsData;
    readonly __cache__?: NodeCacheConfig;
}
export declare type EncodedVariables = string;
export interface CacheNode<CacheEntry> extends Map<EncodedVariables, CacheEntry> {
}
export interface CustomCache<T> {
    (schemaNode: T, requestNode: T, variables: TypeOfMergedVariables<T>, data?: TypeOfPartial<T>): O.Option<TypeOfCacheEntry<T>>;
}
export interface NodeCacheConfig<T = any> {
    readonly isEntity?: boolean;
    readonly isLocal?: boolean;
    readonly useCustomCache?: CustomCache<T>;
}
export interface NodeVariablesDefinition {
    [K: string]: Node;
}
export declare type ExtractVariablesDefinition<T> = T extends {
    readonly __variables_definition__: infer A;
} ? A : never;
export declare type ExtractDefinitionType<V> = {
    [K in keyof V]: TypeOf<V[K]>;
};
export declare type ExtractChildrenVariablesDefinition<T> = T extends {
    readonly __sub_variables_definition__: infer A;
} ? A : never;
declare type Values<T> = T[keyof T];
declare type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never;
export declare function getDefinitionModel<V extends NodeVariablesDefinition>(variables: V): M.Model<{
    [K in keyof V]: TypeOf<V[K]>;
}>;
export declare function int(): IntNode;
export declare function int<V extends NodeVariablesDefinition>(variables: V): IntNode<number, number, Ref<O.Option<number>>, Ref<O.Option<number>>, V>;
export declare const staticInt: IntNode<number, number, Ref<O.Option<number>>, Ref<O.Option<number>>, {}>;
export declare function float(): FloatNode;
export declare function float<V extends NodeVariablesDefinition>(variables: V): FloatNode<number, number, Ref<O.Option<number>>, Ref<O.Option<number>>, V>;
export declare const staticFloat: FloatNode<number, number, Ref<O.Option<number>>, Ref<O.Option<number>>, {}>;
export declare function string(): StringNode;
export declare function string<V extends NodeVariablesDefinition>(variables: V): StringNode<string, string, Ref<O.Option<string>>, Ref<O.Option<string>>, V>;
export declare const staticString: StringNode<string, string, Ref<O.Option<string>>, Ref<O.Option<string>>, {}>;
export declare function boolean(): BooleanNode;
export declare function boolean<V extends NodeVariablesDefinition>(variables: V): BooleanNode<boolean, boolean, Ref<O.Option<boolean>>, Ref<O.Option<boolean>>, V>;
export declare const staticBoolean: BooleanNode<boolean, boolean, Ref<O.Option<boolean>>, Ref<O.Option<boolean>>, {}>;
export declare function scalar<Name extends string, Data>(name: Name, model: M.Model<Data>): ScalarNode<Name, Data, Data, Ref<O.Option<Data>>>;
export declare function scalar<Name extends string, Data, Variables extends NodeVariablesDefinition>(name: Name, model: M.Model<Data>, variables: Variables): ScalarNode<Name, Data, Data, Ref<O.Option<Data>>, Ref<O.Option<Data>>, Variables>;
export declare function type<Name extends string, Members extends {
    [K in keyof Members]: Node;
}>(__typename: Name, members: Members): TypeNode<Name, Members>;
export declare function type<Name extends string, Members extends {
    [K in keyof Members]: Node;
}, Variables extends NodeVariablesDefinition>(__typename: Name, members: Members, variables: Variables): TypeNode<Name, Members, ExtractTypeNodeDataFromMembers<Members>, ExtractTypeNodePartialDataFromMembers<Members>, ExtractTypeNodeRefsFromMembers<Members>, ExtractTypeNodeCacheEntryFromMembers<Members>, Variables>;
export declare function schema<Name extends string, Members extends {
    [K in keyof Members]: Node;
}>(__typename: Name, members: Members): TypeNode<Name, Members>;
export declare function sum<Members extends ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>>(...members: Members): <Variables extends NodeVariablesDefinition>(variables?: Variables) => SumNode<Members, { [K in keyof Members]: TypeOf<Members[K]> & {
    __typename: ExtractTypeName<Members[K]>;
}; }[number], { [K_1 in keyof Members]: TypeOfPartial<Members[K_1]> & {
    __typename?: ExtractTypeName<Members[K_1]> | undefined;
}; }[number], ExtractSumNodeRefsFromMembers<Members>, { [K_2 in keyof Members]: Ref<O.Option<[ExtractTypeName<Members[K_2]>, TypeOfCacheEntry<Members[K_2]>]>>; }[number], Variables, ExtractSumNodeChildrenVariablesDefinitionFromMembers<Members>>;
export declare function map<Key extends Node<{}>, Value extends Node<{}>>(key: Key, value: Value): MapNode<Key, Value>;
export declare function map<Key extends Node<{}>, Value extends Node<{}>, Variables extends NodeVariablesDefinition>(key: Key, value: Value, variables: Variables): MapNode<Key, Value, ExtractMapNodeDataFromKeyValue<Key, Value>, ExtractMapNodePartialDataFromKeyValue<Key, Value>, ExtractMapNodeRefsFromKeyValue<Key, Value>, ExtractMapNodeCacheEntryFromKeyValue<Key, Value>, Variables>;
export declare function array<Wrapped extends Node<{}>>(wrapped: Wrapped): ArrayNode<Wrapped>;
export declare function array<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition>(wrapped: Wrapped, variables: Variables): ArrayNode<Wrapped, ExtractArrayNodeDataFromWrapped<Wrapped>, ExtractArrayNodePartialDataFromWrapped<Wrapped>, ExtractArrayNodeRefsFromWrapped<Wrapped>, ExtractArrayNodeCacheEntryFromWrapped<Wrapped>, Variables>;
export declare function option<Wrapped extends Node<{}>>(wrapped: Wrapped): OptionNode<Wrapped>;
export declare function option<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition>(wrapped: Wrapped, variables: Variables): OptionNode<Wrapped, ExtractOptionNodeDataFromWrapped<Wrapped>, ExtractOptionNodePartialDataFromWrapped<Wrapped>, ExtractOptionNodeRefsFromWrapped<Wrapped>, ExtractOptionNodeCacheEntryFromWrapped<Wrapped>, Variables>;
export declare function nonEmptyArray<Wrapped extends Node<{}>>(wrapped: Wrapped): NonEmptyArrayNode<Wrapped>;
export declare function nonEmptyArray<Wrapped extends Node<{}>, Variables extends NodeVariablesDefinition>(wrapped: Wrapped, variables: Variables): NonEmptyArrayNode<Wrapped, ExtractNonEmptyArrayNodeDataFromWrapped<Wrapped>, ExtractNonEmptyArrayNodePartialDataFromWrapped<Wrapped>, ExtractNonEmptyArrayNodeRefsFromWrapped<Wrapped>, ExtractNonEmptyArrayNodeCacheEntryFromWrapped<Wrapped>, Variables>;
export declare function mutation<Result extends Node>(result: Result): MutationNode<Result>;
export declare function mutation<Result extends Node, Variables extends NodeVariablesDefinition>(result: Result, variables: Variables): MutationNode<Result, TypeOf<Result>, TypeOfPartial<Result>, TypeOfRefs<Result>, TypeOfCacheEntry<Result>, Variables>;
export declare function pickFromType<T extends TypeNode<any, any, any, any, any, any, any, any>, P extends keyof T['members']>(node: T, ...keys: P[]): TypeNode<T['__typename'], Pick<T['members'], P>, ExtractTypeNodeDataFromMembers<Pick<T['members'], P>>, ExtractTypeNodePartialDataFromMembers<Pick<T['members'], P>>, ExtractTypeNodeRefsFromMembers<Pick<T['members'], P>>, ExtractTypeNodeCacheEntryFromMembers<Pick<T['members'], P>>, ExtractVariablesDefinition<T>>;
export declare function omitFromType<T extends TypeNode<any, any, any, any, any, any, any, any>, P extends keyof T['members']>(node: T, ...keys: P[]): TypeNode<T['__typename'], Omit<T['members'], P>, ExtractTypeNodeDataFromMembers<Omit<T['members'], P>>, ExtractTypeNodePartialDataFromMembers<Omit<T['members'], P>>, ExtractTypeNodeRefsFromMembers<Omit<T['members'], P>>, ExtractTypeNodeCacheEntryFromMembers<Omit<T['members'], P>>, ExtractVariablesDefinition<T>>;
export declare function useEq<T extends NodeDefinition<any, any, any, any, any, any>>(node: T, eq: Eq<TypeOf<T>>): T;
export declare function eqById<T extends TypeNode<any, Record<'id', Node>, any, any, any, any, any, any>>(node: T): T;
export declare function useEncoder<T extends NodeDefinition<any, any, any, any, any>>(node: T, encoder: Encoder<TypeOf<T>>): T;
export declare function encodeById<T extends TypeNode<any, Record<'id', Node>, any, any, any, any, any, any>>(node: T): T;
export declare function encodeById<T extends SumNode<ReadonlyArray<TypeNode<any, Record<'id', Node>, any, any, any, any, any, any>>>>(node: T): T;
declare type ExtractEntityType<T extends Node> = T extends TypeNode<any, any, any, any, any, any, any, any> ? TypeNode<T['__typename'], T['members'], ExtractTypeNodeDataFromMembers<T['members']>, ExtractTypeNodePartialDataFromMembers<T['members']>, Ref<O.Option<TypeOf<T>>>, Ref<O.Option<TypeOf<T>>>, ExtractVariablesDefinition<T>> : T extends ArrayNode<any, any, any, any, any, any, any> ? ArrayNode<T['wrapped'], ExtractArrayNodeDataFromWrapped<T['wrapped']>, ExtractArrayNodePartialDataFromWrapped<T['wrapped']>, Ref<O.Option<TypeOf<T['wrapped']>[]>>, Ref<O.Option<TypeOf<T['wrapped']>[]>>, ExtractVariablesDefinition<T>> : T extends NonEmptyArrayNode<any, any, any, any, any, any, any> ? NonEmptyArrayNode<T['wrapped'], ExtractNonEmptyArrayNodeDataFromWrapped<T['wrapped']>, ExtractNonEmptyArrayNodePartialDataFromWrapped<T['wrapped']>, Ref<O.Option<NonEmptyArray<TypeOf<T['wrapped']>>>>, Ref<O.Option<NonEmptyArray<TypeOf<T['wrapped']>>>>, ExtractVariablesDefinition<T>> : T extends OptionNode<any, any, any, any, any, any, any> ? OptionNode<T['wrapped'], ExtractOptionNodeDataFromWrapped<T['wrapped']>, ExtractOptionNodePartialDataFromWrapped<T['wrapped']>, Ref<O.Option<O.Option<TypeOf<T['wrapped']>>>>, Ref<O.Option<O.Option<TypeOf<T['wrapped']>>>>, ExtractVariablesDefinition<T>> : T extends MapNode<any, any, any, any, any, any, any, any> ? MapNode<T['key'], T['wrapped'], ExtractMapNodeDataFromKeyValue<T['key'], T['wrapped']>, ExtractMapNodePartialDataFromKeyValue<T['key'], T['wrapped']>, Ref<O.Option<Map<TypeOf<T['key']>, TypeOf<T['wrapped']>>>>, Ref<O.Option<Map<TypeOf<T['key']>, TypeOf<T['wrapped']>>>>, ExtractVariablesDefinition<T>> : T extends SumNode<any, any, any, any, any, any, any> ? SumNode<T['members'], ExtractSumNodeDataFromMembers<T['members']>, ExtractSumNodePartialDataFromMembers<T['members']>, Ref<O.Option<TypeOf<T>>>, Ref<O.Option<TypeOf<T>>>, ExtractVariablesDefinition<T>> : T;
export declare function markAsEntity<T extends Node>(node: T): ExtractEntityType<T>;
export declare function markAsLocal<T extends Node>(node: T): T;
export declare function useCustomCache<T extends Node>(node: T, customCache: CustomCache<T>): T;
export {};
