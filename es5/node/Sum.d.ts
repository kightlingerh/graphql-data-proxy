import { Option } from 'fp-ts/Option';
import { BaseNode, DynamicNodeConfig, ExtractSubVariablesDefinition, ExtractVariablesDefinition, Intersection, ModifyOutputIfLocal, NodeVariables, StaticNodeConfig, TypeOf, TypeOfCacheEntry, TypeOfPartial, TypeOfPartialInput, TypeOfPartialOutput, TypeOfStrictInput, TypeOfStrictOutput, Ref, ModifyIfEntity, TypeOfRefs } from './shared';
import { BaseTypeNode, ExtractTypeName } from './Type';
declare type SumTypeNode = BaseTypeNode<any, any, any, any, any>;
declare type ExtractTypeOfSumNodeStrictInput<MS extends ReadonlyArray<SumTypeNode>> = {
    [K in keyof MS]: TypeOfStrictInput<MS[K]> & {
        __typename: ExtractTypeName<MS[K]>;
    };
}[number];
declare type ExtractTypeOfSumNodeStrictOutput<MS extends ReadonlyArray<SumTypeNode>> = {
    [K in keyof MS]: TypeOfStrictOutput<MS[K]> & {
        __typename: ExtractTypeName<MS[K]>;
    };
}[number];
declare type ExtractTypeOfSumNode<MS extends ReadonlyArray<SumTypeNode>> = {
    [K in keyof MS]: TypeOf<MS[K]> & {
        __typename: ExtractTypeName<MS[K]>;
    };
}[number];
declare type ExtractTypeOfPartialSumNode<MS extends ReadonlyArray<SumTypeNode>> = {
    [K in keyof MS]: TypeOfPartial<MS[K]> & {
        __typename?: ExtractTypeName<MS[K]>;
    };
}[number];
declare type ExtractTypeOfSumNodePartialInput<MS extends ReadonlyArray<SumTypeNode>> = {
    [K in keyof MS]: TypeOfPartialInput<MS[K]> & {
        __typename?: ExtractTypeName<MS[K]>;
    };
}[number];
declare type ExtractTypeOfSumNodePartialOutput<MS extends ReadonlyArray<SumTypeNode>> = {
    [K in keyof MS]: TypeOfPartialOutput<MS[K]> & {
        __typename?: ExtractTypeName<MS[K]>;
    };
}[number];
export declare type ExtractSumNodeCacheEntry<MS extends ReadonlyArray<SumTypeNode>> = {
    [K in keyof MS]: Ref<Option<[ExtractTypeName<MS[K]>, TypeOfCacheEntry<MS[K]>]>>;
}[number];
export declare type ExtractSumNodeSubVariablesDefinition<MS extends ReadonlyArray<SumTypeNode>> = {} & Intersection<{
    [K in keyof MS]: ExtractSubVariablesDefinition<MS[K]> & ExtractVariablesDefinition<MS[K]>;
}[number]>;
export declare type ExtractSumNodeRefs<MS extends ReadonlyArray<SumTypeNode>> = {
    [K in keyof MS]: Ref<Option<TypeOfRefs<MS[K]>>>;
}[number];
export interface SumNode<MS extends ReadonlyArray<SumTypeNode>, Variables extends NodeVariables = {}, IsLocal extends boolean = false, IsEntity extends boolean = false> extends BaseNode<ExtractTypeOfSumNodeStrictInput<MS>, ModifyOutputIfLocal<IsLocal, ExtractTypeOfSumNodeStrictOutput<MS>>, ExtractTypeOfSumNode<MS>, ExtractTypeOfSumNodePartialInput<MS>, ModifyOutputIfLocal<IsLocal, ExtractTypeOfSumNodePartialOutput<MS>>, ExtractTypeOfPartialSumNode<MS>, ModifyIfEntity<IsEntity, ExtractTypeOfSumNode<MS>, ExtractSumNodeCacheEntry<MS>>, Variables, ExtractSumNodeSubVariablesDefinition<MS>, ExtractSumNodeRefs<MS>> {
    readonly tag: 'Sum';
    readonly members: MS;
    readonly membersRecord: Record<ExtractTypeName<{
        [K in keyof MS]: MS[K];
    }[number]>, MS[number]>;
}
export interface StaticSumNodeConfig<IsLocal extends boolean, IsEntity extends boolean> extends StaticNodeConfig<IsLocal, IsEntity> {
}
export interface DynamicSumNodeConfig<Variables extends NodeVariables, IsLocal extends boolean, IsEntity extends boolean> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {
}
export declare function sum<MS extends ReadonlyArray<SumTypeNode>, IsLocal extends boolean = false, IsEntity extends boolean = false>(ms: MS, config?: StaticSumNodeConfig<IsLocal, IsEntity>): SumNode<MS, {}, IsLocal, IsEntity>;
export declare function sum<MS extends ReadonlyArray<SumTypeNode>, Variables extends NodeVariables, IsLocal extends boolean = false, IsEntity extends boolean = false>(ms: MS, config: DynamicSumNodeConfig<Variables, IsLocal, IsEntity>): SumNode<MS, Variables, IsLocal, IsEntity>;
export {};
