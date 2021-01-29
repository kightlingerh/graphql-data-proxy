import { Option } from 'fp-ts/lib/Option';
import { Model } from '../model/Model';
import { BaseNode, DynamicNodeConfig, ModifyOutputIfLocal, NodeVariables, Ref, StaticNodeConfig } from './shared';
export interface ScalarNode<Name extends string, Input, Output, Data, Variables extends NodeVariables = {}, IsLocal extends boolean = false> extends BaseNode<Input, ModifyOutputIfLocal<IsLocal, Output>, Data, Input, ModifyOutputIfLocal<IsLocal, Output>, Data, Ref<Option<Data>>, Variables> {
    readonly tag: 'Scalar';
    readonly name: Name;
}
export interface StaticScalarNodeConfig<IsLocal extends boolean> extends StaticNodeConfig<IsLocal> {
    hasEncodingTransformations?: boolean;
    hasDecodingTransformations?: boolean;
}
export interface DynamicScalarNodeConfig<Variables extends NodeVariables, IsLocal extends boolean> extends DynamicNodeConfig<Variables, IsLocal> {
    hasEncodingTransformations?: boolean;
    hasDecodingTransformations?: boolean;
}
export declare function scalar<Name extends string, Input, Output, Data, IsLocal extends boolean = false>(name: Name, model: Model<Input, Output, Data>, config?: StaticScalarNodeConfig<IsLocal>): ScalarNode<Name, Input, Output, Data, {}, IsLocal>;
export declare function scalar<Name extends string, Input, Output, Data, V extends NodeVariables, IsLocal extends boolean = false>(name: Name, model: Model<Input, Output, Data>, config: DynamicScalarNodeConfig<V, IsLocal>): ScalarNode<Name, Input, Output, Data, V, IsLocal>;
