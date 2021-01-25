import { NonEmptyArray } from 'fp-ts/NonEmptyArray';
import { Option } from 'fp-ts/Option';
import { Ref as R } from 'vue';
import * as M from '../model/Model';
export declare type AnyBaseNode = BaseNode<any, any, any, any, any, any, any, any, any>;
export declare type Ref<T> = R<T>;
export interface BaseNode<StrictInput, StrictOutput, StrictData, PartialInput, PartialOutput, PartialData, CacheEntry, Variables extends NodeVariables = {}, SubVariables extends NodeVariables = {}, Refs = CacheEntry> {
    readonly tag: string;
    readonly strict: M.Model<StrictInput, StrictOutput, StrictData>;
    readonly partial: M.Model<PartialInput, PartialOutput, PartialData>;
    readonly variables: Variables;
    readonly __hasTransformations: {
        readonly decoding: boolean;
        readonly encoding: boolean;
    };
    readonly __refs?: Refs;
    readonly __subVariables?: SubVariables;
    readonly __isLocal?: boolean;
    readonly __isEntity?: boolean;
    readonly __cacheEntry?: CacheEntry;
}
export declare type TypeOf<T> = T extends {
    readonly strict: M.Model<any, any, infer A>;
} ? A : never;
export declare type TypeOfStrictInput<T> = T extends {
    readonly strict: M.Model<infer I, any, any>;
} ? I : never;
export declare type TypeOfStrictOutput<T> = T extends {
    readonly strict: M.Model<any, infer O, any>;
} ? O : never;
export declare type TypeOfPartial<T> = T extends {
    readonly partial: M.Model<any, any, infer A>;
} ? A : never;
export declare type TypeOfPartialInput<T> = T extends {
    readonly partial: M.Model<infer I, any, any>;
} ? I : never;
export declare type TypeOfPartialOutput<T> = T extends {
    readonly partial: M.Model<any, infer O, any>;
} ? O : never;
export declare type ExtractVariablesDefinition<T> = T extends {
    readonly variables: Record<string, AnyBaseNode>;
} ? T['variables'] : never;
declare type IsNonEmptyObject<T> = keyof T extends never ? true : false;
export declare type EncodedVariables = string;
export declare type CacheNode<T> = IsNonEmptyObject<ExtractVariablesDefinition<T>> extends true ? Map<EncodedVariables, TypeOfCacheEntry<T>> : TypeOfCacheEntry<T>;
export declare type ExtractNodeDefinitionType<T> = T extends Record<string, AnyBaseNode> ? {
    [K in keyof T]: TypeOf<T[K]>;
} : never;
export declare type TypeOfVariables<T> = ExtractNodeDefinitionType<ExtractVariablesDefinition<T>>;
export declare type ExtractSubVariablesDefinition<T> = T extends {
    readonly __subVariables?: Record<string, AnyBaseNode>;
} ? Exclude<T['__subVariables'], undefined> : never;
export declare type TypeOfSubVariables<T> = ExtractNodeDefinitionType<ExtractSubVariablesDefinition<T>>;
export declare type TypeOfRefs<T> = T extends {
    readonly __refs?: infer A;
} ? Exclude<A, undefined> : never;
export declare type TypeOfCacheEntry<T> = T extends {
    readonly __cacheEntry?: infer A;
} ? Exclude<A, undefined> : never;
export declare type TypeOfMergedVariables<T> = TypeOfSubVariables<T> & TypeOfVariables<T>;
export declare type ExtractMergedVariablesDefinition<T> = ExtractSubVariablesDefinition<T> & ExtractVariablesDefinition<T>;
export declare type ModifyOutputIfLocal<IsLocal, Output> = IsLocal extends true ? undefined : Output;
export declare type ModifyIfEntity<IsEntity, Data, CacheEntry> = IsEntity extends true ? Ref<Option<Data>> : CacheEntry;
export interface StaticNodeConfig<IsLocal extends boolean = false, IsEntity extends boolean = false> {
    readonly variables?: Record<string, AnyBaseNode>;
    readonly isLocal?: IsLocal;
    readonly isEntity?: IsEntity;
}
export interface DynamicNodeConfig<Variables extends NodeVariables, IsLocal extends boolean = false, IsEntity extends boolean = false> extends StaticNodeConfig<IsLocal, IsEntity> {
    readonly variables: Variables;
}
export declare type NodeVariables = Record<string, AnyBaseNode>;
export declare type Path = NonEmptyArray<string | number>;
export interface CustomCache<PartialData, Variables> {
    toId: <V extends Record<string, unknown> = Record<string, unknown>>(path: Path, variables?: Variables & V, data?: PartialData) => unknown;
}
export declare const EMPTY_VARIABLES: any;
export declare const EMPTY_VARIABLES_MODEL: M.Model<unknown, {}, {}>;
export declare function extractStrictModels<MS extends Record<string, AnyBaseNode>>(members: MS): {
    [K in keyof MS]: MS[K]['strict'];
};
export declare function extractPartialModels<MS extends Record<string, AnyBaseNode>>(members: MS): {
    [K in keyof MS]: MS[K]['partial'];
};
export declare const NO_TRANSFORMATIONS: {
    decoding: boolean;
    encoding: boolean;
};
export declare const HAS_TRANSFORMATIONS: {
    decoding: boolean;
    encoding: boolean;
};
export declare function useLocalModel<I, O, A>(model: M.Model<I, O, A>): M.Model<I, undefined, A>;
export declare type Values<T> = T[keyof T];
export declare type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never;
export declare function useAdjustedModel(model: M.Model<any, any, any>, isLocal: boolean, useIdEncoder: boolean, useIdDecoder: boolean): any;
export declare function hasEncodingTransformations(ms: Record<string, AnyBaseNode>): boolean;
export declare function hasDecodingTransformations(ms: Record<string, AnyBaseNode>): boolean;
export {};
