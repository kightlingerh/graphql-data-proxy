import { IO } from 'fp-ts/lib/IO';
import * as IOE from 'fp-ts/lib/IOEither';
import { Monoid } from 'fp-ts/lib/Monoid';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as O from 'fp-ts/lib/Option';
import { Tree } from 'fp-ts/lib/Tree';
export declare function isEmptyObject(obj: object): obj is {};
export declare function isEmptyString(x: any): boolean;
export declare const constEmptyString: import("fp-ts/lib/function").Lazy<string>;
export declare const constEmptyArray: import("fp-ts/lib/function").Lazy<never[]>;
export declare const constMap: import("fp-ts/lib/function").Lazy<Map<any, any>>;
export declare const constNone: import("fp-ts/lib/function").Lazy<O.Option<never>>;
export declare function isFunction(u: unknown): u is Function;
export declare const cacheErrorApplicativeValidation: import("fp-ts/lib/Monad").Monad2C<"IOEither", NonEmptyArray<Tree<string>>> & import("fp-ts/lib/Bifunctor").Bifunctor2<"IOEither"> & import("fp-ts/lib/Alt").Alt2C<"IOEither", NonEmptyArray<Tree<string>>> & import("fp-ts/lib/MonadIO").MonadIO2C<"IOEither", NonEmptyArray<Tree<string>>> & import("fp-ts/lib/MonadThrow").MonadThrow2C<"IOEither", NonEmptyArray<Tree<string>>>;
export interface CacheWriteResult extends CacheResult<Evict> {
}
export interface CacheResult<T> extends IO<T> {
}
export interface Evict extends IO<void> {
}
export interface CacheError extends NonEmptyArray<Tree<string>> {
}
export declare const cacheWriteResultMonoid: Monoid<CacheWriteResult>;
export declare function taskVoid(): Promise<void>;
export declare function concatEvict(x: Evict, y: Evict): Evict;
export interface Persist {
    store(key: string, value: string): IOE.IOEither<CacheError, void>;
    restore<T>(key: string): IOE.IOEither<CacheError, O.Option<T>>;
}
