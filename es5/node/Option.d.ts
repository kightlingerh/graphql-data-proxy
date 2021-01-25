import { Option } from 'fp-ts/Option';
import { BaseNode, DynamicNodeConfig, ExtractSubVariablesDefinition, ExtractVariablesDefinition, ModifyOutputIfLocal, AnyBaseNode, NodeVariables, StaticNodeConfig, TypeOf, TypeOfPartial, TypeOfPartialInput, TypeOfPartialOutput, TypeOfStrictInput, TypeOfStrictOutput, TypeOfCacheEntry, Ref, ModifyIfEntity, TypeOfRefs } from './shared';
export interface OptionNode<Item extends AnyBaseNode, Variables extends NodeVariables = {}, IsLocal extends boolean = false, IsEntity extends boolean = false> extends BaseNode<TypeOfStrictInput<Item> | null | undefined, ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Item> | null>, Option<TypeOf<Item>>, TypeOfPartialInput<Item> | null | undefined, ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Item> | null>, Option<TypeOfPartial<Item>>, ModifyIfEntity<IsEntity, Option<TypeOf<Item>>, Ref<Option<TypeOfCacheEntry<Item>>>>, Variables, ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>, ModifyIfEntity<IsEntity, Option<TypeOf<Item>>, Ref<Option<TypeOfRefs<Item>>>>> {
    readonly tag: 'Option';
    readonly item: Item;
}
export interface StaticOptionNodeConfig<IsLocal extends boolean, IsEntity extends boolean> extends StaticNodeConfig<IsLocal, IsEntity> {
}
export interface DynamicOptionNodeConfig<Variables extends NodeVariables, IsLocal extends boolean, IsEntity extends boolean> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {
}
export declare function option<Item extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(item: Item, config?: StaticOptionNodeConfig<IsLocal, IsEntity>): OptionNode<Item, {}, IsLocal, IsEntity>;
export declare function option<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false, IsEntity extends boolean = false>(item: Item, config: DynamicOptionNodeConfig<Variables, IsLocal, IsEntity>): OptionNode<Item, Variables, IsLocal>;
