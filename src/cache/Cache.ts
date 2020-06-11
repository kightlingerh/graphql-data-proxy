import { isNonEmpty } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { Ref } from '../shared'
import * as N from '../node/Node'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	ofRef: N.OfRef
	persist?: N.Persist
}

export interface Cache<R> {
	write(variables: N.TypeOfMergedVariables<R>): Reader<N.ExtractPartialModelType<R>, N.CacheWriteResult>
	read(variables: N.TypeOfMergedVariables<R>): N.CacheResult<O.Option<N.ExtractModelType<R>>>
	toRefs(variables: N.TypeOfMergedVariables<R>): N.CacheResult<N.ExtractRefsType<R>>
	toRef(variables: N.TypeOfMergedVariables<R>): N.CacheResult<Ref<N.ExtractModelType<R>>>
}

export interface RequestCache<R> extends Reader<R, Cache<R>> {}

export function make<S extends N.SchemaNode<any, any>>(c: S) {
	return (deps: CacheDependencies) => {
		const store = c.store({ persist: deps.persist, ofRef: deps.ofRef, path: deps.id || 'root' })
		return <R extends N.SchemaNode<any, any>>(r: R) => {
			const errors = validate(c, r)
			if (isNonEmpty(errors)) {
				return left<N.CacheError, Cache<R>>(errors)
			} else {
				const readC = store.read(r)
				const toRefsC = store.toRefs(r)
				const toRefC = store.toRef(r)
				return right<N.CacheError, Cache<R>>({
					write: store.write,
					read: (variables) => readC(variables) as N.CacheResult<O.Option<N.ExtractModelType<R>>>,
					toRefs: (variables) => toRefsC(variables) as N.CacheResult<N.ExtractRefsType<R>>,
					toRef: (variables) => toRefC(variables) as N.CacheResult<Ref<N.ExtractModelType<R>>>
				})
			}
		}
	}
}
