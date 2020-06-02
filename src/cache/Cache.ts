import { isNonEmpty } from 'fp-ts/lib/Array'
import { Either, left, right } from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import * as D from '../document/DocumentNode'
import { Ref } from '../shared'
import * as N from '../node/Node'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	ofRef: N.OfRef
	persist?: N.Persist
}

export interface Make {
	<R extends N.TypeNode<string, any>>(request: R): Either<N.CacheError, RequestProxy<R>>
}

export interface RequestProxy<N> {
	write(variables: N.ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, N.CacheWriteResult>
	read(variables: N.ExtractMergedVariablesType<N>): N.CacheResult<O.Option<D.ExtractModelType<N>>>
	toRefs(variables: N.ExtractMergedVariablesType<N>): N.CacheResult<D.ExtractRefType<N>>
	toRef(variables: N.ExtractMergedVariablesType<N>): N.CacheResult<Ref<D.ExtractModelType<N>>>
}

export function cache<Cache extends N.TypeNode<string, any>>(c: Cache): Reader<CacheDependencies, Make> {
	return (deps) => {
		return <R extends N.TypeNode<string, any>>(r: R) => {
			const errors = validate(c)(r)
			if (isNonEmpty(errors)) {
				return left(errors)
			} else {
				const store = c.store({ persist: deps.persist, ofRef: deps.ofRef, path: deps.id || 'root' })
				const readC = store.read(r)
				const toRefsC = store.toRefs(r)
				const toRefC = store.toRef(r)
				return right<N.CacheError, RequestProxy<R>>({
					write: store.write,
					read: (variables) => readC(variables) as N.CacheResult<O.Option<D.ExtractModelType<R>>>,
					toRefs: (variables) => toRefsC(variables) as N.CacheResult<D.ExtractRefType<R>>,
					toRef: (variables) => toRefC(variables) as N.CacheResult<Ref<D.ExtractModelType<R>>>
				})
			}
		}
	}
}
