import { NonEmptyArray } from 'fp-ts/NonEmptyArray';
import { Option } from 'fp-ts/Option';
import * as EQ from './Eq';
import * as EN from './Encoder';
import * as TD from './TaskDecoder';
import * as G from './Guard';
import { Lazy } from 'fp-ts/function';
import { Literal } from './Schemable';
export interface Model<I, O, A> extends TD.TaskDecoder<I, A>, EN.Encoder<O, A>, G.Guard<unknown, A>, EQ.Eq<A> {
}
export declare type TypeOf<M> = M extends Model<any, any, infer A> ? A : never;
export declare const string: Model<string, string, string>;
export declare const number: Model<number, number, number>;
export declare const int: Model<number, number, G.Int>;
export declare const float: Model<number, number, G.Float>;
export declare const boolean: Model<boolean, boolean, boolean>;
export declare function literal<A extends readonly [Literal, ...Array<Literal>]>(...values: A): Model<unknown, A[number], A[number]>;
export declare function fromType<P extends Record<string, Model<any, any, any>>>(properties: P): Model<{
    [K in keyof P]: TD.InputOf<P[K]>;
}, {
    [K in keyof P]: EN.OutputOf<P[K]>;
}, {
    [K in keyof P]: TypeOf<P[K]>;
}>;
export declare function type<P extends Record<string, Model<any, any, any>>>(properties: P): Model<unknown, {
    [K in keyof P]: EN.OutputOf<P[K]>;
}, {
    [K in keyof P]: TypeOf<P[K]>;
}>;
export declare function fromPartial<P extends Record<string, Model<any, any, any>>>(properties: P): Model<Partial<{
    [K in keyof P]: TD.InputOf<P[K]>;
}>, Partial<{
    [K in keyof P]: EN.OutputOf<P[K]>;
}>, Partial<{
    [K in keyof P]: TypeOf<P[K]>;
}>>;
export declare function partial<P extends Record<string, Model<any, any, any>>>(properties: P): Model<unknown, Partial<{
    [K in keyof P]: EN.OutputOf<P[K]>;
}>, Partial<{
    [K in keyof P]: TypeOf<P[K]>;
}>>;
export declare function fromArray<I, O, A>(item: Model<I, O, A>): Model<Array<I>, Array<O>, Array<A>>;
export declare function array<O, A>(item: Model<unknown, O, A>): Model<unknown, Array<O>, Array<A>>;
export declare function fromNonEmptyArray<I, O, A>(item: Model<I, O, A>): Model<Array<I>, Array<O>, NonEmptyArray<A>>;
export declare function nonEmptyArray<O, A>(val: Model<unknown, O, A>): Model<unknown, Array<O>, NonEmptyArray<A>>;
export declare function fromMap<IK extends string | number, IA, O, OK, OA, K, A>(key: Model<IK, OK, K>, item: Model<IA, OA, A>): Model<Record<IK, IA>, O, Map<K, A>>;
export declare function map<O, OK, OA, K, A>(key: Model<unknown, OK, K>, item: Model<unknown, OA, A>): Model<Record<string | number, unknown>, O, Map<K, A>>;
export declare function fromSet<I, O, A>(item: Model<I, O, A>): Model<Array<I>, Array<O>, Set<A>>;
export declare function set<O, A>(item: Model<unknown, O, A>): Model<unknown, Array<O>, Set<A>>;
export declare function fromOption<I, O, A>(item: Model<I, O, A>): Model<I | null, O | null, Option<A>>;
export declare function fromOption<I, O, A>(item: Model<I, O, A>, lazy: Lazy<O>): Model<I | null, O, Option<A>>;
export declare function option<O, A>(item: Model<unknown, O, A>): Model<unknown, O | null, Option<A>>;
export declare function option<O, A>(item: Model<unknown, O, A>, lazy: Lazy<O>): Model<unknown, O, Option<A>>;
export declare const optionString: Model<string | null, string | null, Option<string>>;
export declare const optionNumber: Model<number | null, number | null, Option<number>>;
export declare const optionBoolean: Model<boolean | null, boolean | null, Option<boolean>>;
export declare function nullable<I, O, A>(item: Model<I, O, A>): Model<I | null, O | null, A | null>;
export declare function fromSum<T extends string>(tag: T): <MS extends Record<string, Model<any, any, any>>>(members: MS) => Model<TD.InputOf<MS[keyof MS]>, EN.OutputOf<MS[keyof MS]>, TypeOf<MS[keyof MS]>>;
export declare function sum<T extends string>(tag: T): <MS extends Record<string, Model<any, any, any>>>(members: MS) => Model<unknown, EN.OutputOf<MS[keyof MS]>, TypeOf<MS[keyof MS]>>;
export declare function fromTuple<MS extends ReadonlyArray<Model<any, any, any>>>(...members: MS): Model<{
    [K in keyof MS]: TD.InputOf<MS[K]>;
}, {
    [K in keyof MS]: EN.OutputOf<MS[K]>;
}, {
    [K in keyof MS]: TypeOf<MS[K]>;
}>;
export declare function lazy<I, O, A>(id: string, model: Lazy<Model<I, O, A>>): Model<I, O, A>;
export declare function useEncoder<I, O, A>(model: Model<I, O, A>): <OB>(encoder: EN.Encoder<OB, A>) => Model<I, OB, A>;
export declare function useIdentityEncoder<I, O, A>(model: Model<I, O, A>): Model<I, A, A>;
export declare function encodeById<I, O, A extends Record<'id', Literal>>(model: Model<I, O, A>): Model<I, Literal, A>;
export declare function useEq<I, O, A>(model: Model<I, O, A>, eq: EQ.Eq<A>): Model<I, O, A>;
export declare function eqById<I, O, A extends Record<'id', Literal>>(model: Model<I, O, A>): Model<I, O, A>;
export declare function useDecoder<I, O, A>(model: Model<I, O, A>): <IB>(decoder: TD.TaskDecoder<IB, A>) => Model<IB, O, A>;
export declare function useIdentityDecoder<I, O, A>(model: Model<I, O, A>): Model<A, O, A>;
