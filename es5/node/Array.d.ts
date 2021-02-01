import { BaseNode, DynamicNodeConfig, ExtractSubVariablesDefinition, ExtractVariablesDefinition, ModifyOutputIfLocal, AnyBaseNode, NodeVariables, StaticNodeConfig, TypeOf, TypeOfPartial, TypeOfPartialInput, TypeOfPartialOutput, TypeOfStrictInput, TypeOfStrictOutput, TypeOfCacheEntry, ModifyIfEntity, TypeOfRefs } from './shared';
export interface ArrayNode<Item extends AnyBaseNode, Variables extends NodeVariables = {}, IsLocal extends boolean = false, IsEntity extends boolean = false> extends BaseNode<Array<TypeOfStrictInput<Item>>, ModifyOutputIfLocal<IsLocal, Array<TypeOfStrictOutput<Item>>>, Array<TypeOf<Item>>, Array<TypeOfPartialInput<Item>>, ModifyOutputIfLocal<IsLocal, Array<TypeOfPartialOutput<Item>>>, Array<TypeOfPartial<Item>>, ModifyIfEntity<IsEntity, Array<TypeOf<Item>>, Array<TypeOfCacheEntry<Item>>>, Variables, ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>, ModifyIfEntity<IsEntity, Array<TypeOf<Item>>, Array<TypeOfRefs<Item>>>> {
    readonly tag: 'Array';
    readonly item: Item;
}
export interface StaticArrayNodeConfig<IsLocal extends boolean, IsEntity extends boolean> extends StaticNodeConfig<IsLocal, IsEntity> {
}
export interface DynamicArrayNodeConfig<Variables extends NodeVariables, IsLocal extends boolean, IsEntity extends boolean> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {
}
export declare function array<Item extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(item: Item, config?: StaticArrayNodeConfig<IsLocal, IsEntity>): ArrayNode<Item, {}, IsLocal, IsEntity>;
export declare function array<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false, IsEntity extends boolean = false>(item: Item, config: DynamicArrayNodeConfig<Variables, IsLocal, IsEntity>): ArrayNode<Item, Variables, IsLocal, IsEntity>;
export declare function markArrayAsEntity<T extends ArrayNode<any, any, any, any>>(node: T): ArrayNode<T['item'], T['variables'], Exclude<T['__isLocal'], undefined>, true>;
