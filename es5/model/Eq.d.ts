import { getEq as getEqEither } from 'fp-ts/Either';
import { getEq as getEqOption } from 'fp-ts/Option';
import { Float, Int } from './Guard';
export * from 'io-ts/Eq';
export interface Eq<A> {
    readonly equals: (x: A, y: A) => boolean;
}
export declare const int: Eq<Int>;
export declare const float: Eq<Float>;
export declare const option: typeof getEqOption;
export declare const either: typeof getEqEither;
export declare const map: <K, A>(SK: import("fp-ts/lib/Eq").Eq<K>, SA: import("fp-ts/lib/Eq").Eq<A>) => import("fp-ts/lib/Eq").Eq<Map<K, A>>;
export declare const set: <A>(E: import("fp-ts/lib/Eq").Eq<A>) => import("fp-ts/lib/Eq").Eq<Set<A>>;
export declare const nonEmptyArray: <A>(E: import("fp-ts/lib/Eq").Eq<A>) => import("fp-ts/lib/Eq").Eq<import("fp-ts/lib/NonEmptyArray").NonEmptyArray<A>>;
