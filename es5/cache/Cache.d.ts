import { Endomorphism } from 'fp-ts/function';
import { IO } from 'fp-ts/IO';
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';
import { Option } from 'fp-ts/Option';
import { Reader } from 'fp-ts/Reader';
import { Task } from 'fp-ts/Task';
import { TaskEither } from 'fp-ts/TaskEither';
import { Tree } from 'fp-ts/Tree';
import * as N from '../node';
export interface CacheError extends NonEmptyArray<Tree<string>> {
}
export interface Persist {
    store(key: string, value: unknown): TaskEither<CacheError, void>;
    restore<T>(key: string): TaskEither<CacheError, T>;
    delete(key: string): TaskEither<CacheError, void>;
    update<T>(key: string, f: Endomorphism<T>): TaskEither<CacheError, void>;
}
export interface CacheDependencies {
    id?: string;
    persist?: Persist;
    useImmutableArrays?: boolean;
}
export interface CacheWriteResult extends Task<Evict> {
}
export interface Evict extends IO<void> {
}
export interface Cache<R extends N.SchemaNode<any, any>> {
    read: Reader<N.TypeOfMergedVariables<R>, IO<Option<N.TypeOf<R>>>>;
    write: Reader<N.TypeOfMergedVariables<R>, Reader<N.TypeOfPartial<R>, CacheWriteResult>>;
    toEntries: Reader<N.TypeOfMergedVariables<R>, IO<N.TypeOfRefs<R>>>;
}
export declare function make(deps: CacheDependencies): <S extends N.SchemaNode<any, any>>(schema: S) => <R extends N.SchemaNode<any, any>>(request: R) => import("fp-ts/lib/Either").Either<CacheError, Cache<R>>;
