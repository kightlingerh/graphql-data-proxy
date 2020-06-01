import { Either } from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { Reader } from 'fp-ts/lib/Reader';
import * as D from '../document/DocumentNode';
import { Ref } from '../shared';
import * as S from '../node/Node';
export interface CacheDependencies {
    id?: string;
    ofRef: S.OfRef;
    persist?: S.Persist;
}
export interface Make {
    <R extends S.TypeNode<string, any>>(request: R): Either<S.CacheError, RequestProxy<R>>;
}
export interface RequestProxy<N> {
    write(variables: S.ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, S.CacheWriteResult>;
    read(variables: S.ExtractMergedVariablesType<N>): S.CacheResult<O.Option<D.ExtractModelType<N>>>;
    toRefs(variables: S.ExtractMergedVariablesType<N>): S.CacheResult<D.ExtractRefType<N>>;
    toRef(variables: S.ExtractMergedVariablesType<N>): S.CacheResult<Ref<D.ExtractModelType<N>>>;
}
export declare function cache<Cache extends S.TypeNode<string, any>>(c: Cache): Reader<CacheDependencies, Make>;
