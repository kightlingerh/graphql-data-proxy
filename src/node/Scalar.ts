import { Option } from 'fp-ts/lib/Option';
import { Model } from '../model/Model';
import {
	ModifyOutputIfLocal,
	NodeVariables,
	Ref,
	useLocalModel,
	PrimitiveNodeOptions,
	BaseNode,
	_HasDecodingTransformations,
	_HasEncodingTransformations
} from './shared';

export interface ScalarNodeOptions<Variables extends NodeVariables = {}> extends PrimitiveNodeOptions<Variables> {
	readonly hasDecodingTransformations?: boolean;
	readonly hasEncodingTransformations?: boolean;
}

export class ScalarNode<
	Name extends string,
	Input,
	Output,
	Data,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		Input,
		ModifyOutputIfLocal<IsLocal, Output>,
		Data,
		Input,
		ModifyOutputIfLocal<IsLocal, Output>,
		Data,
		Ref<Option<Data>>,
		Variables
	>
	implements Model<Input, IsLocal extends true ? undefined : Input, Data> {
	readonly tag = 'Scalar';
	readonly encode: Model<Input, IsLocal extends true ? undefined : Input, Data>['encode'];
	readonly decode: Model<Input, IsLocal extends true ? undefined : Input, Data>['decode'];
	readonly equals: Model<Input, IsLocal extends true ? undefined : Input, Data>['equals'];
	readonly is: Model<Input, IsLocal extends true ? undefined : Input, Data>['is'];
	readonly [_HasDecodingTransformations]: boolean;
	readonly [_HasEncodingTransformations]: boolean;
	constructor(readonly name: Name, model: Model<Input, Output, Data>, options?: ScalarNodeOptions<Variables>) {
		super(options);
		const m = options?.isLocal ? useLocalModel(model) : model;
		this.encode = m.encode as any;
		this.decode = m.decode;
		this.equals = m.equals;
		this.is = m.is;
		this[_HasDecodingTransformations] = options?.hasDecodingTransformations ?? false;
		this[_HasEncodingTransformations] = options?.hasEncodingTransformations ?? false;
	}
}

export function scalar<
	Name extends string,
	Input,
	Output,
	Data,
	Variables extends NodeVariables,
	IsLocal extends boolean = false
>(
	name: Name,
	model: Model<Input, Output, Data>,
	options?: ScalarNodeOptions<Variables>
): ScalarNode<Name, Input, Output, Data, Variables, IsLocal> {
	return new ScalarNode(name, model, options);
}
