import { Option } from 'fp-ts/lib/Option';
import { Reader } from 'fp-ts/lib/Reader';
import * as N from '../node/Node';
import { CacheError, CacheResult, CacheWriteResult, Persist } from '../shared';
export interface CacheDependencies {
    id?: string;
    persist?: Persist;
}
export interface Cache<R> {
    write(variables: N.TypeOfMergedVariables<R>): Reader<N.TypeOfPartial<R>, CacheWriteResult>;
    read(variables: N.TypeOfMergedVariables<R>): CacheResult<Option<N.TypeOf<R>>>;
    toRefs(variables: N.TypeOfMergedVariables<R>): CacheResult<N.TypeOfRefs<R>>;
}
export declare function make(_: CacheDependencies): <S extends N.SchemaNode<any, any>>(schema: S) => <R extends N.SchemaNode<any, any>>(request: R) => import("fp-ts/lib/Either").Either<CacheError, Cache<R>>;
