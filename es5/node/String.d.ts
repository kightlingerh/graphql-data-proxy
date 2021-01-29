import { Option } from 'fp-ts/lib/Option';
import { BaseNode, DynamicNodeConfig, ModifyOutputIfLocal, NodeVariables, Ref, StaticNodeConfig } from './shared';
export interface StringNode<Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<string, ModifyOutputIfLocal<IsLocal, string>, string, string, ModifyOutputIfLocal<IsLocal, string>, string, Ref<Option<string>>, Variables> {
    readonly tag: 'String';
}
export interface StaticStringNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {
}
export interface DynamicStringNodeConfig<Variables extends NodeVariables, IsLocal extends boolean> extends DynamicNodeConfig<Variables, IsLocal> {
}
export declare function string<IsLocal extends boolean = false>(config?: StaticStringNodeConfig<IsLocal>): StringNode<{}, IsLocal>;
export declare function string<V extends NodeVariables, IsLocal extends boolean = false>(config: DynamicStringNodeConfig<V, IsLocal>): StringNode<V, IsLocal>;
export declare const staticString: StringNode<{}, false>;
