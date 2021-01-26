import { ScalarNode } from './Scalar';
import { BaseNode, DynamicNodeConfig, ExtractNodeDefinitionType, ExtractSubVariablesDefinition, ExtractVariablesDefinition, Intersection, ModifyOutputIfLocal, AnyBaseNode, NodeVariables, StaticNodeConfig, TypeOf, TypeOfPartial, TypeOfPartialInput, TypeOfPartialOutput, TypeOfStrictInput, TypeOfStrictOutput, Values, CacheNode, ModifyIfEntity, TypeOfRefs, CustomCache } from './shared';
export declare type ExtractTypeName<T> = T extends {
    readonly __typename: infer A;
} ? A : never;
export declare type ExtractTypeNodeStrictDataFromMembers<MS extends Record<string, AnyBaseNode>> = {
    [K in keyof MS]: TypeOf<MS[K]>;
};
export declare type ExtractTypeNodeStrictInputFromMembers<MS extends Record<string, AnyBaseNode>> = {
    [K in keyof MS]: TypeOfStrictInput<MS[K]>;
};
export declare type ExtractTypeNodeStrictOutputFromMembers<MS extends Record<string, AnyBaseNode>> = {
    [K in keyof MS]: TypeOfStrictOutput<MS[K]>;
};
export declare type ExtractTypeNodePartialDataFromMembers<MS extends Record<string, AnyBaseNode>> = {
    [K in keyof MS]?: TypeOfPartial<MS[K]>;
};
export declare type ExtractTypeNodePartialInputFromMembers<MS extends Record<string, AnyBaseNode>> = {
    [K in keyof MS]?: TypeOfPartialInput<MS[K]>;
};
export declare type ExtractTypeNodePartialOutputFromMembers<MS extends Record<string, AnyBaseNode>> = {
    [K in keyof MS]?: TypeOfPartialOutput<MS[K]>;
};
export declare type ExtractTypeNodeCacheEntryFromMembers<MS extends Record<string, AnyBaseNode>> = {
    [K in keyof MS]: CacheNode<MS[K]>;
};
export declare type ExtractTypeNodeRefsFromMembers<MS extends Record<string, AnyBaseNode>> = {
    [K in keyof MS]: TypeOfRefs<MS[K]>;
};
export declare type ExtractTypeNodeSubVariablesFromMembers<MS extends Record<string, AnyBaseNode>> = {} & Intersection<Values<{
    [K in keyof MS]: ExtractSubVariablesDefinition<MS[K]> & ExtractVariablesDefinition<MS[K]>;
}>>;
export interface TypenameNode<Name extends string> extends ScalarNode<Name, string, string, Name> {
}
export interface BaseTypeNode<Typename extends string, MS extends Record<string, AnyBaseNode>, Variables extends NodeVariables = {}, IsLocal extends boolean = false, IsEntity extends boolean = false> extends BaseNode<ExtractTypeNodeStrictInputFromMembers<MS>, ModifyOutputIfLocal<IsLocal, ExtractTypeNodeStrictOutputFromMembers<MS>>, ExtractTypeNodeStrictDataFromMembers<MS>, ExtractTypeNodePartialInputFromMembers<MS>, ModifyOutputIfLocal<IsLocal, ExtractTypeNodePartialOutputFromMembers<MS>>, ExtractTypeNodePartialDataFromMembers<MS>, ModifyIfEntity<IsEntity, ExtractTypeNodeStrictDataFromMembers<MS>, ExtractTypeNodeCacheEntryFromMembers<MS>>, Variables, ExtractTypeNodeSubVariablesFromMembers<MS>, ExtractTypeNodeRefsFromMembers<MS>> {
    readonly __typename: Typename;
    readonly tag: 'Type';
    readonly members: MS;
    readonly __customCache?: CustomCache<ExtractTypeNodePartialDataFromMembers<MS>, ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS> & Variables>>;
}
export declare type TypeNode<Typename extends string, MS extends Record<string, AnyBaseNode>, Variables extends NodeVariables = {}, IsLocal extends boolean = false, IncludeTypename extends boolean = false, IsEntity extends boolean = false> = IncludeTypename extends true ? BaseTypeNode<Typename, MS & {
    __typename: TypenameNode<Typename>;
}, Variables, IsLocal, IsEntity> : BaseTypeNode<Typename, MS, Variables, IsLocal, IsEntity>;
export interface StaticTypeNodeConfig<MS extends Record<string, AnyBaseNode>, IsLocal extends boolean, IncludeTypename extends boolean, IsEntity extends boolean> extends StaticNodeConfig<IsLocal, IsEntity> {
    includeTypename?: IncludeTypename;
    useCustomCache?: CustomCache<ExtractTypeNodePartialDataFromMembers<MS>, ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS>>>;
}
export interface DynamicTypeNodeConfig<MS extends Record<string, AnyBaseNode>, Variables extends NodeVariables, IsLocal extends boolean, IncludeTypename extends boolean, IsEntity extends boolean> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {
    includeTypename?: IncludeTypename;
    useCustomCache?: CustomCache<ExtractTypeNodePartialDataFromMembers<MS>, ExtractNodeDefinitionType<ExtractTypeNodeSubVariablesFromMembers<MS>>>;
}
export declare const TYPE_TAG = "Type";
export declare function type<Typename extends string, MS extends Record<string, AnyBaseNode>, IsLocal extends boolean = false, IncludeTypename extends boolean = false, IsEntity extends boolean = false>(__typename: Typename, ms: MS, config?: StaticTypeNodeConfig<MS, IsLocal, IncludeTypename, IsEntity>): TypeNode<Typename, MS, {}, IsLocal, IncludeTypename, IsEntity>;
export declare function type<Typename extends string, MS extends Record<string, AnyBaseNode>, Variables extends NodeVariables, IsLocal extends boolean = false, IncludeTypename extends boolean = false, IsEntity extends boolean = false>(__typename: Typename, ms: MS, config: DynamicTypeNodeConfig<MS, Variables, IsLocal, IncludeTypename, IsEntity>): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename, IsEntity>;
export declare function pickFromType<T extends TypeNode<any, any, any, any, any>, P extends keyof T['members']>(node: T, keys: P[]): TypeNode<ExtractTypeName<T>, Pick<T['members'], P>, T['variables']>;
export declare function omitFromType<T extends TypeNode<any, any, any, any, any>, P extends keyof T['members']>(node: T, keys: P[]): TypeNode<ExtractTypeName<T>, Omit<T['members'], P>, T['variables']>;
export declare function eqById<T extends TypeNode<any, Record<'id', AnyBaseNode>, any, any, any>>(node: T): T;
export declare function encodeById<Typename extends string, MS extends {
    id: AnyBaseNode;
    [K: string]: AnyBaseNode;
}, Variables extends NodeVariables = {}, IsLocal extends boolean = false, IncludeTypename extends boolean = false, IsEntity extends boolean = false>(node: TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename, IsEntity>): TypeNode<Typename, MS, Variables, IsLocal, IncludeTypename, IsEntity>;
export declare function markAsEntity<T extends BaseTypeNode<any, any, any, any, any>>(node: T): BaseTypeNode<T['__typename'], T['members'], T['variables'], Exclude<T['__isLocal'], undefined>, true>;
