import { isNonEmpty } from 'fp-ts/lib/Array'
import { Either, left, right } from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import * as D from '../document/DocumentNode'
import { Ref } from '../shared'
import * as C from './CacheNode'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	ofRef: C.OfRef
	persist?: C.Persist
}

export interface Make {
	<R extends C.TypeNode<string, any>>(request: R): Either<C.CacheError, RequestProxy<R>>
}

export interface RequestProxy<N> {
	write(variables: C.ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, C.CacheWriteResult>
	read(variables: C.ExtractMergedVariablesType<N>): C.CacheResult<O.Option<D.ExtractModelType<N>>>
	toRefs(variables: C.ExtractMergedVariablesType<N>): C.CacheResult<D.ExtractRefType<N>>
	toRef(variables: C.ExtractMergedVariablesType<N>): C.CacheResult<Ref<D.ExtractModelType<N>>>
}

export function cache<Cache extends C.TypeNode<string, any>>(c: Cache): Reader<CacheDependencies, Make> {
	return (deps) => {
		return <R extends C.TypeNode<string, any>>(r: R) => {
			const errors = validate(c)(r)
			if (isNonEmpty(errors)) {
				return left(errors)
			} else {
				const store = c.store({ persist: deps.persist, ofRef: deps.ofRef, path: deps.id || 'root' });
				return right<C.CacheError, RequestProxy<R>>({
					write: store.write,
					read: (variables) => store.read(r)(variables) as C.CacheResult<O.Option<D.ExtractModelType<R>>>,
					toRefs: (variables) => store.toRefs(r)(variables) as C.CacheResult<D.ExtractRefType<R>>,
					toRef: (variables) => store.toRef(r)(variables) as C.CacheResult<Ref<D.ExtractModelType<R>>>
				})
			}
		}
	}
}
