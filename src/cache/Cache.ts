import { isNonEmpty } from 'fp-ts/lib/Array'
import { Either, left, right } from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import * as D from '../document/DocumentNode'
import { Ref } from '../shared'
import * as S from '../node/Node'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	ofRef: S.OfRef
	persist?: S.Persist
}

export interface Make {
	<R extends S.TypeNode<string, any>>(request: R): Either<S.CacheError, RequestProxy<R>>
}

export interface RequestProxy<N> {
	write(variables: S.ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, S.CacheWriteResult>
	read(variables: S.ExtractMergedVariablesType<N>): S.CacheResult<O.Option<D.ExtractModelType<N>>>
	toRefs(variables: S.ExtractMergedVariablesType<N>): S.CacheResult<D.ExtractRefType<N>>
	toRef(variables: S.ExtractMergedVariablesType<N>): S.CacheResult<Ref<D.ExtractModelType<N>>>
}

export function cache<Cache extends S.TypeNode<string, any>>(c: Cache): Reader<CacheDependencies, Make> {
	return (deps) => {
		return <R extends S.TypeNode<string, any>>(r: R) => {
			const errors = validate(c)(r)
			if (isNonEmpty(errors)) {
				return left(errors)
			} else {
				const store = c.store({ persist: deps.persist, ofRef: deps.ofRef, path: deps.id || 'root' })
				return right<S.CacheError, RequestProxy<R>>({
					write: store.write,
					read: (variables) => store.read(r)(variables) as S.CacheResult<O.Option<D.ExtractModelType<R>>>,
					toRefs: (variables) => store.toRefs(r)(variables) as S.CacheResult<D.ExtractRefType<R>>,
					toRef: (variables) => store.toRef(r)(variables) as S.CacheResult<Ref<D.ExtractModelType<R>>>
				})
			}
		}
	}
}
