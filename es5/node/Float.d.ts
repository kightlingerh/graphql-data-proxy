import { Option } from 'fp-ts/lib/Option';
import { Float } from '../model/Guard';
import { BaseNode, DynamicNodeConfig, ModifyOutputIfLocal, NodeVariables, Ref, StaticNodeConfig } from './shared';
export interface FloatNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<number, ModifyOutputIfLocal<IsLocal, number>, Float, number, ModifyOutputIfLocal<IsLocal, number>, Float, Ref<Option<Float>>, Variables> {
    readonly tag: 'Float';
}
export interface StaticFloatNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {
}
export interface DynamicFloatNodeConfig<Variables extends NodeVariables, IsLocal extends boolean> extends DynamicNodeConfig<Variables, IsLocal> {
}
export declare function float<IsLocal extends boolean = false>(config?: StaticFloatNodeConfig<IsLocal>): FloatNode<{}, IsLocal>;
export declare function float<V extends NodeVariables, IsLocal extends boolean = false>(config: DynamicFloatNodeConfig<V, IsLocal>): FloatNode<V, IsLocal>;
export declare const staticFloat: FloatNode<{}, false>;
