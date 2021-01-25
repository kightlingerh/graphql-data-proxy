import { BaseNode, DynamicNodeConfig, ExtractSubVariablesDefinition, ExtractVariablesDefinition, ModifyOutputIfLocal, AnyBaseNode, NodeVariables, StaticNodeConfig, TypeOf, TypeOfPartial, TypeOfPartialInput, TypeOfPartialOutput, TypeOfStrictInput, TypeOfStrictOutput, TypeOfCacheEntry, ModifyIfEntity, TypeOfRefs } from './shared';
export interface MutationNode<Result extends AnyBaseNode, Variables extends NodeVariables = {}, IsLocal extends boolean = false, IsEntity extends boolean = false> extends BaseNode<TypeOfStrictInput<Result>, ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Result>>, TypeOf<Result>, TypeOfPartialInput<Result>, ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Result>>, TypeOfPartial<Result>, ModifyIfEntity<IsEntity, TypeOf<Result>, TypeOfCacheEntry<Result>>, Variables, ExtractSubVariablesDefinition<Result> & ExtractVariablesDefinition<Result>, ModifyIfEntity<IsEntity, TypeOf<Result>, TypeOfRefs<Result>>> {
    readonly tag: 'Mutation';
    readonly result: Result;
}
export interface StaticMutationNodeConfig<IsLocal extends boolean, IsEntity extends boolean> extends StaticNodeConfig<IsLocal, IsEntity> {
}
export interface DynamicMutationNodeConfig<Variables extends NodeVariables, IsLocal extends boolean, IsEntity extends boolean> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {
}
export declare function mutation<Result extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(result: Result, config?: StaticMutationNodeConfig<IsLocal, IsEntity>): MutationNode<Result, {}, IsLocal, IsEntity>;
export declare function mutation<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false, IsEntity extends boolean = false>(result: Item, config: DynamicMutationNodeConfig<Variables, IsLocal, IsEntity>): MutationNode<Item, Variables, IsLocal, IsEntity>;
