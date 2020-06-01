import * as EQ from 'fp-ts/lib/Eq';
import { Lazy } from 'fp-ts/lib/function';
import * as C from 'io-ts/lib/Codec';
import * as G from 'io-ts/lib/Guard';
import * as O from 'fp-ts/lib/Option';
import * as NE from 'fp-ts/lib/NonEmptyArray';
import { Literal } from 'io-ts/lib/Schemable';
export interface Model<T> extends C.Codec<T>, G.Guard<T>, EQ.Eq<T> {
}
export declare type TypeOf<M> = M extends Model<infer T> ? T : never;
export declare const string: Model<string>;
export declare const number: Model<number>;
export declare const boolean: Model<boolean>;
export declare function type<T>(members: {
    [K in keyof T]: Model<T[K]>;
}): Model<T>;
export declare function partial<T>(members: {
    [K in keyof T]: Model<T[K]>;
}): Model<Partial<T>>;
export declare function intersection<A, B>(left: Model<A>, right: Model<B>): Model<A & B>;
export declare function union<A extends ReadonlyArray<unknown>>(...members: {
    [K in keyof A]: Model<A[K]>;
}): Model<A[number]>;
export declare function typeWithUniqueIdentifier<T, K extends keyof T>(properties: {
    [K in keyof T]: Model<T[K]>;
}, key: K): Model<T>;
export declare function nonEmptyArray<T>(val: Model<T>): Model<NE.NonEmptyArray<T>>;
export declare function array<T>(val: Model<T>): Model<T[]>;
export declare function map<Key, Value>(key: Model<Key>, value: Model<Value>): Model<Map<Key, Value>>;
export declare function set<T>(model: Model<T>): Model<Set<T>>;
export declare function option<T>(val: Model<T>, lazy?: Lazy<T | null>): Model<O.Option<T>>;
export declare const optionString: Model<O.Option<string>>;
export declare const optionNumber: Model<O.Option<number>>;
export declare const optionBoolean: Model<O.Option<boolean>>;
export declare function sum<T extends string>(tag: T): <A>(members: {
    [K in keyof A]: Model<A[K] & Record<T, K>>;
}) => Model<A[keyof A]>;
export declare function literal<A extends ReadonlyArray<Literal>>(...values: A): Model<A[number]>;
