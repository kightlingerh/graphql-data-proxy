import { Either } from 'fp-ts/Either';
import { Lazy } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { Option } from 'fp-ts/lib/Option';
import * as EN from 'io-ts/Encoder';
export * from 'io-ts/Encoder';
export declare const string: EN.Encoder<string, string>;
export declare const boolean: EN.Encoder<boolean, boolean>;
export declare const number: EN.Encoder<number, number>;
export declare const int: EN.Encoder<number, number>;
export declare const float: EN.Encoder<number, number>;
export declare function option<O, A>(item: EN.Encoder<O, A>): EN.Encoder<O | null, Option<A>>;
export declare function option<O, A>(item: EN.Encoder<O, A>, lazy: Lazy<O>): EN.Encoder<O, Option<A>>;
export declare const either: <OL, OR, L, R>(l: EN.Encoder<OL, L>, r: EN.Encoder<OR, R>) => EN.Encoder<OL | OR, Either<L, R>>;
export declare const map: <O, OK, OA, K, A>(fromPairs: (pairs: [OK, OA][]) => O) => (k: EN.Encoder<OK, K>, a: EN.Encoder<OA, A>) => EN.Encoder<O, Map<K, A>>;
export declare const set: <O, A>(item: EN.Encoder<O, A>) => EN.Encoder<O[], Set<A>>;
export declare const nonEmptyArray: <O, A>(item: EN.Encoder<O, A>) => EN.Encoder<O[], NonEmptyArray<A>>;