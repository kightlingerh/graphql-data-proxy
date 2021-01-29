import { Option } from 'fp-ts/lib/Option';
import { BaseNode, DynamicNodeConfig, ModifyOutputIfLocal, NodeVariables, Ref, StaticNodeConfig } from './shared';
export interface BooleanNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<boolean, ModifyOutputIfLocal<IsLocal, boolean>, boolean, boolean, ModifyOutputIfLocal<IsLocal, boolean>, boolean, Ref<Option<boolean>>, Variables> {
    readonly tag: 'Boolean';
}
export interface StaticBooleanNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {
}
export interface DynamicBooleanNodeConfig<Variables extends NodeVariables, IsLocal extends boolean> extends DynamicNodeConfig<Variables, IsLocal> {
}
export declare function boolean<IsLocal extends boolean = false>(config?: StaticBooleanNodeConfig<IsLocal>): BooleanNode<{}, IsLocal>;
export declare function boolean<V extends NodeVariables, IsLocal extends boolean = false>(config: DynamicBooleanNodeConfig<V, IsLocal>): BooleanNode<V, IsLocal>;
export declare const staticBoolean: BooleanNode<{}, false>;
