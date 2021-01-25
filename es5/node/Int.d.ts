import { Option } from 'fp-ts/Option';
import { Int } from '../model/Guard';
import { BaseNode, DynamicNodeConfig, ModifyOutputIfLocal, NodeVariables, Ref, StaticNodeConfig } from './shared';
export interface IntNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<number, ModifyOutputIfLocal<IsLocal, number>, Int, number, ModifyOutputIfLocal<IsLocal, number>, Int, Ref<Option<Int>>, Variables> {
    readonly tag: 'Int';
}
export interface StaticIntNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {
}
export interface DynamicIntNodeConfig<Variables extends NodeVariables, IsLocal extends boolean> extends DynamicNodeConfig<Variables, IsLocal> {
}
export declare function int<IsLocal extends boolean = false>(config?: StaticIntNodeConfig<IsLocal>): IntNode<{}, IsLocal>;
export declare function int<V extends NodeVariables, IsLocal extends boolean = false>(config: DynamicIntNodeConfig<V, IsLocal>): IntNode<V, IsLocal>;
export declare const staticInt: IntNode<{}, false>;
