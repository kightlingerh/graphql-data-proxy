import { constUndefined, Lazy } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { Option } from 'fp-ts/lib/Option';
import { Ref as R } from 'vue';
import * as M from '../model/Model';

export type AnyNode = INode<any, any, any, any, any, any, any, any, any, any>;

export type Ref<T> = R<T>;

export const _StrictDataInput = '_SDI';

export const _StrictDataOutput = '_SDO';

export const _StrictData = '_SD';

export const _PartialDataInput = '_PDI';

export const _PartialDataOutput = '_PDO';

export const _PartialData = '_PD';

export const _Variables = 'variables';

export const _SubVariables = '_SV';

export const _Ref = '_R';

export const _CacheEntry = '_CE';

export const _HasDecodingTransformations = '_DT';

export const _HasEncodingTransformations = '_ET';

export const _Print = '_P';

export const _IsLocal = '_IL';

export const _IsEntity = '_IE';

export const _ToId = '_TI';

interface _NodeOptions<PD, V extends NodeVariables> {
	readonly print?: Lazy<string>;
	readonly isLocal?: boolean;
	readonly isEntity?: boolean;
	readonly toId?: ToId<PD, V>;
	readonly variables: V;
}

export type NodeOptions<PD, V extends NodeVariables = {}> = IsNonEmptyObject<V> extends true
	? _NodeOptions<PD, V>
	: Omit<_NodeOptions<PD, V>, 'variables'> & { variables?: {} };

export interface INode<
	SDI,
	SDO,
	SD,
	PDI,
	PDO,
	PD,
	CE,
	V extends NodeVariables = {},
	SV extends NodeVariables = {},
	R = CE
> {
	readonly options: NodeOptions<PD, V>;
	readonly [_SubVariables]: SV;

	// for internal use
	readonly [_HasDecodingTransformations]: boolean;
	readonly [_HasEncodingTransformations]: boolean;
	readonly [_StrictDataInput]: SDI;
	readonly [_StrictDataOutput]: SDO;
	readonly [_StrictData]: SD;
	readonly [_PartialDataInput]: PDI;
	readonly [_PartialDataOutput]: PDO;
	readonly [_PartialData]: PD;
	readonly [_Ref]: R;
}

export abstract class BaseNode<
	SDI,
	SDO,
	SD,
	PDI,
	PDO,
	PD,
	CE,
	V extends NodeVariables = {},
	SV extends NodeVariables = {},
	R = CE
> implements INode<SDI, SDO, SD, PDI, PDO, PD, CE, V, SV, R> {
	readonly [_Variables]: V;
	readonly [_SubVariables]!: SV;
	readonly [_HasDecodingTransformations]: boolean;
	readonly [_HasEncodingTransformations]: boolean;
	readonly [_StrictDataInput]!: SDI;
	readonly [_StrictDataOutput]!: SDO;
	readonly [_StrictData]!: SD;
	readonly [_PartialDataInput]!: PDI;
	readonly [_PartialDataOutput]!: PDO;
	readonly [_PartialData]!: PD;
	readonly [_Ref]!: R;

	constructor(readonly options: NodeOptions<PD, V> = {} as NodeOptions<PD, V>) {
		this[_Variables] = options.variables ?? EMPTY_VARIABLES;
	}
}

export type TypeOf<T> = [T] extends [{ [_StrictData]: infer A }] ? A : never;

export type TypeOfStrictInput<T> = [T] extends [{ [_StrictDataInput]: infer I }] ? I : never;

export type TypeOfStrictOutput<T> = [T] extends [{ [_StrictDataOutput]: infer O }] ? O : never;

export type TypeOfPartial<T> = [T] extends [{ [_PartialData]: infer A }] ? A : never;

export type TypeOfPartialInput<T> = [T] extends [{ [_PartialDataInput]: infer I }] ? I : never;

export type TypeOfPartialOutput<T> = [T] extends [{ [_PartialDataOutput]: infer O }] ? O : never;

export type ExtractVariablesDefinition<T> = [T] extends [{ [_Variables]: Record<string, AnyNode> }]
	? T[typeof _Variables]
	: {};

export type TypeOfRefs<T> = [T] extends [{ [_Ref]: infer R }] ? R : never;

export type TypeOfCacheEntry<T> = [T] extends [{ [_CacheEntry]: infer CE }] ? CE : never;

type IsNonEmptyObject<T> = keyof T extends never ? true : false;

export type EncodedVariables = string;

export type CacheNode<T> = IsNonEmptyObject<ExtractVariablesDefinition<T>> extends true
	? Map<EncodedVariables, TypeOfCacheEntry<T>>
	: TypeOfCacheEntry<T>;

export type ExtractNodeDefinitionType<T> = [T] extends [Record<string, AnyNode>] ? { [K in keyof T]: TypeOf<T[K]> } : never;

export type ExtractNodeDefinitionOutput<T> = [T] extends [Record<string, AnyNode>]
	? { [K in keyof T]: TypeOfStrictOutput<T[K]> }
	: never;

export type ExtractNodeDefinitionInput<T> = [T] extends [Record<string, AnyNode>]
	? { [K in keyof T]: TypeOfStrictInput<T[K]> }
	: never;

export type TypeOfVariables<T> = ExtractNodeDefinitionType<ExtractVariablesDefinition<T>>;

export type TypeOfVariablesInput<T> = ExtractNodeDefinitionInput<ExtractVariablesDefinition<T>>;

export type TypeOfVariablesOutput<T> = ExtractNodeDefinitionOutput<ExtractVariablesDefinition<T>>;

export type ExtractSubVariablesDefinition<T> = [T] extends [{ [_SubVariables]: Record<string, AnyNode> }]
	? T[typeof _SubVariables]
	: {};

export type TypeOfSubVariables<T> = ExtractNodeDefinitionType<ExtractSubVariablesDefinition<T>>;

export type TypeOfSubVariablesInput<T> = ExtractNodeDefinitionInput<ExtractSubVariablesDefinition<T>>;

export type TypeOfSubVariablesOutput<T> = ExtractNodeDefinitionOutput<ExtractSubVariablesDefinition<T>>;

export type TypeOfMergedVariables<T> = TypeOfSubVariables<T> & TypeOfVariables<T>;

export type ExtractMergedVariablesDefinition<T> = ExtractSubVariablesDefinition<T> & ExtractVariablesDefinition<T>;

export type ModifyOutputIfLocal<IsLocal, Output> = IsLocal extends true ? undefined : Output;

export type ModifyIfEntity<IsEntity, Data, CacheEntry> = IsEntity extends true ? Ref<Option<Data>> : CacheEntry;

export type Values<T> = T[keyof T];

export type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never;

export type NodeVariables = Record<string, AnyNode>;

export type ExtractIsLocal<T> = [T] extends [{ options: NodeOptions<any, any> }]
	? [T['options']['isLocal']] extends [boolean]
		? T['options']['isLocal']
		: false
	: never;

export type ExtractIsEntity<T> = [T] extends [{ options: NodeOptions<any, any> }]
	? [T['options']['isEntity']] extends [boolean]
		? T['options']['isEntity']
		: false
	: never;


export type Path = NonEmptyArray<string | number>;

export interface ToId<PartialData, Variables> {
	<V extends Record<string, unknown> = Record<string, unknown>>(
		path: Path,
		variables?: Variables & V,
		data?: PartialData
	): unknown;
}

export const EMPTY_VARIABLES: any = {};

export function useLocalModel<I, O, A>(model: M.Model<I, O, A>): M.Model<I, undefined, A> {
	return {
		...model,
		encode: constUndefined
	};
}

export function useAdjustedModel(
	model: M.Model<any, any, any>,
	isLocal: boolean,
	useIdEncoder: boolean,
	useIdDecoder: boolean
) {
	if (isLocal) {
		return useLocalModel(model);
	}
	if (__DEV__ || !__DISABLE_VALIDATION__) {
		return model;
	}
	if (useIdEncoder && useIdDecoder) {
		return M.useIdentityDecoder(M.useIdentityEncoder(model));
	}
	if (useIdEncoder) {
		return M.useIdentityEncoder(model);
	}
	if (useIdDecoder) {
		return M.useIdentityDecoder(model);
	}
	return model as any;
}

export function hasEncodingTransformations(ms: Record<string, AnyNode>): boolean {
	for (const k in ms) {
		if (ms[k]?.[_HasEncodingTransformations]) {
			return true;
		}
	}
	return false;
}

export function hasDecodingTransformations(ms: Record<string, AnyNode>): boolean {
	for (const k in ms) {
		if (ms[k]?.[_HasDecodingTransformations]) {
			return true;
		}
	}
	return false;
}
