import { Option } from 'fp-ts/lib/Option';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { BaseNode, DynamicNodeConfig, ExtractSubVariablesDefinition, ExtractVariablesDefinition, ModifyOutputIfLocal, AnyBaseNode, NodeVariables, StaticNodeConfig, TypeOf, TypeOfPartial, TypeOfPartialInput, TypeOfPartialOutput, TypeOfStrictInput, TypeOfStrictOutput, Ref, TypeOfCacheEntry, ModifyIfEntity, TypeOfRefs } from './shared';
export interface NonEmptyArrayNode<Item extends AnyBaseNode, Variables extends NodeVariables = {}, IsLocal extends boolean = false, IsEntity extends boolean = false> extends BaseNode<Array<TypeOfStrictInput<Item>>, ModifyOutputIfLocal<IsLocal, NonEmptyArray<TypeOfStrictOutput<Item>>>, NonEmptyArray<TypeOf<Item>>, Array<TypeOfPartialInput<Item>>, ModifyOutputIfLocal<IsLocal, NonEmptyArray<TypeOfPartialOutput<Item>>>, NonEmptyArray<TypeOfPartial<Item>>, ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfCacheEntry<Item>>>>>, Variables, ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>, ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfRefs<Item>>>>>> {
    readonly tag: 'NonEmptyArray';
    readonly item: Item;
}
export interface StaticNonEmptyArrayNodeConfig<IsLocal extends boolean, IsEntity extends boolean> extends StaticNodeConfig<IsLocal, IsEntity> {
}
export interface DynamicNonEmptyArrayNodeConfig<Variables extends NodeVariables, IsLocal extends boolean, IsEntity extends boolean> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {
}
export declare function nonEmptyArray<Item extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(item: Item, config?: StaticNonEmptyArrayNodeConfig<IsLocal, IsEntity>): NonEmptyArrayNode<Item, {}, IsLocal, IsEntity>;
export declare function nonEmptyArray<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false, IsEntity extends boolean = false>(item: Item, config: DynamicNonEmptyArrayNodeConfig<Variables, IsLocal, IsEntity>): NonEmptyArrayNode<Item, Variables, IsLocal, IsEntity>;
export declare function markNonEmptyArrayAsEntity<T extends NonEmptyArrayNode<any, any, any, any>>(node: T): NonEmptyArrayNode<T['item'], T['variables'], Exclude<T['__isLocal'], undefined>, true>;
