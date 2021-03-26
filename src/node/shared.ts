import { constUndefined, Lazy } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { Option } from 'fp-ts/lib/Option';
import { Ref as R } from 'vue';
import { Model } from '../model/Model';

export type AnyNode = INode<any, any, any, any, any, any, any, any, any, any>;

export type Ref<T> = R<T>;

const _StrictDataInput = '_SDI';

const _StrictDataOutput = '_SDO';

const _StrictData = '_SD';

const _PartialDataInput = '_PDI';

const _PartialDataOutput = '_PDO';

const _PartialData = '_PD';

const _Variables = '_V';

type _Variables = typeof _Variables;

const _SubVariables = '_SV';

type _SubVariables = typeof _SubVariables;

const _Ref = '_R';

const _CacheEntry = '_CE';

export interface BaseNodeOptions<
	IsLocal extends boolean = false,
	IsEntity extends boolean = false,
	Variables extends NodeVariables = {}
> {
	readonly variables?: Variables;
	readonly isLocal?: IsLocal;
	readonly isEntity?: IsEntity;
	readonly print?: Lazy<string>;
}

export interface DynamicNodeOptions<
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends BaseNodeOptions<IsLocal, IsEntity> {
	readonly variables: Variables;
}

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
	readonly [_Variables]: V;

	// for internal use
	readonly [_SubVariables]: SV;
	readonly [_StrictDataInput]: SDI;
	readonly [_StrictDataOutput]: SDO;
	readonly [_StrictData]: SD;
	readonly [_PartialDataInput]: PDI;
	readonly [_PartialDataOutput]: PDO;
	readonly [_PartialData]: PD;
	readonly [_Ref]: R;
	readonly [_CacheEntry]: CE;
}

const EMPTY_VARIABLES: any = {};

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
	readonly [_Variables]!: V;
	readonly [_SubVariables]!: SV;
	readonly [_StrictDataInput]!: SDI;
	readonly [_StrictDataOutput]!: SDO;
	readonly [_StrictData]!: SD;
	readonly [_PartialDataInput]!: PDI;
	readonly [_PartialDataOutput]!: PDO;
	readonly [_PartialData]!: PD;
	readonly [_Ref]!: R;
	readonly [_CacheEntry]!: CE;

	protected constructor(vars?: V) {
		this[_Variables] = vars ?? EMPTY_VARIABLES;
	}

	get variables(): V {
		return this[_Variables];
	}
}

export type TypeOf<T> = [T] extends [{ [_StrictData]: infer A }] ? A : never;

export type TypeOfStrictInput<T> = [T] extends [{ [_StrictDataInput]: infer I }] ? I : never;

export type TypeOfStrictOutput<T> = [T] extends [{ [_StrictDataOutput]: infer O }] ? O : never;

export type TypeOfPartial<T> = [T] extends [{ [_PartialData]: infer A }] ? A : never;

export type TypeOfPartialInput<T> = [T] extends [{ [_PartialDataInput]: infer I }] ? I : never;

export type TypeOfPartialOutput<T> = [T] extends [{ [_PartialDataOutput]: infer O }] ? O : never;

export type ExtractVariablesDefinition<T> = [T] extends [{ [_Variables]: Record<string, AnyNode> }]
	? T[_Variables]
	: {};

export type TypeOfRefs<T> = [T] extends [{ [_Ref]: infer R }] ? R : never;

export type TypeOfCacheEntry<T> = [T] extends [{ [_CacheEntry]: infer CE }] ? CE : never;

type IsNonEmptyObject<T> = [keyof T] extends [never] ? true : false;

export type EncodedVariables = string;

export type CacheNode<T> = [IsNonEmptyObject<ExtractVariablesDefinition<T>>] extends [true]
	? TypeOfCacheEntry<T>
	: Map<EncodedVariables, TypeOfCacheEntry<T>>;

export type ExtractNodeDefinitionType<T> = [T] extends [Record<string, AnyNode>]
	? { [K in keyof T]: TypeOf<T[K]> }
	: never;

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
	? T[_SubVariables]
	: {};

export type TypeOfSubVariables<T> = ExtractNodeDefinitionType<ExtractSubVariablesDefinition<T>>;

export type TypeOfSubVariablesInput<T> = ExtractNodeDefinitionInput<ExtractSubVariablesDefinition<T>>

export type TypeOfSubVariablesOutput<T> = ExtractNodeDefinitionOutput<ExtractSubVariablesDefinition<T>>

export type TypeOfMergedVariables<T> = TypeOfSubVariables<T> & TypeOfVariables<T>;

export type TypeOfMergedVariablesInput<T> = TypeOfSubVariablesInput<T> & TypeOfVariablesInput<T>;

export type TypeOfMergedVariablesOutput<T> = TypeOfSubVariablesOutput<T> & TypeOfVariablesOutput<T>

export type ExtractMergedVariablesDefinition<T> = ExtractSubVariablesDefinition<T> & ExtractVariablesDefinition<T>;

export type ModifyOutputIfLocal<IsLocal, Output> = [IsLocal] extends [true] ? undefined : Output;

export type ModifyIfEntity<IsEntity, Data, CacheEntry> = [IsEntity] extends [true] ? Ref<Option<Data>> : CacheEntry;

export type Values<T> = T[keyof T];

export type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never;

export type ExtractTag<T> = [T] extends [{ tag: infer A }] ? A : never;

export type NodeVariables = Record<string, AnyNode>;

export type ExtractIsLocal<T> = [T] extends [{ options: BaseNodeOptions<boolean, boolean, any> }]
	? [T['options']['isLocal']] extends [boolean]
		? T['options']['isLocal']
		: false
	: never;

export type ExtractIsEntity<T> = [T] extends [{ options: BaseNodeOptions<boolean, boolean, any> }]
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
	): string | number | undefined;
}

export function useLocalModel<I, O, A>(model: Model<I, O, A>): Model<I, undefined, A> {
	return {
		...model,
		encode: constUndefined
	};
}
