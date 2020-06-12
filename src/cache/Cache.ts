import { isNonEmpty } from 'fp-ts/lib/Array'
import { left, right } from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import * as N from '../node/Node'
import {CacheError, CacheResult, CacheWriteResult, Persist, Reactivity} from '../shared'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	reactivity: Reactivity
	persist?: Persist
}

export interface Cache<R> {
	write(variables: N.TypeOfMergedVariables<R>): Reader<N.ExtractPartialModelType<R>, CacheWriteResult>
	read(variables: N.TypeOfMergedVariables<R>): CacheResult<O.Option<N.ExtractModelType<R>>>
	toRefs(variables: N.TypeOfMergedVariables<R>): CacheResult<N.ExtractRefsType<R>>
}

export interface RequestCache<R> extends Reader<R, Cache<R>> {}

export function make<S extends N.SchemaNode<any, any>>(c: S) {
	return (deps: CacheDependencies) => {
		const store = c.store({ persist: deps.persist, reactivity: deps.reactivity, path: deps.id || 'root' })
		return <R extends N.SchemaNode<any, any>>(r: R) => {
			const errors = validate(c, r)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				const readC = store.read(r)
				const toRefsC = store.toRefs(r)
				return right<CacheError, Cache<R>>({
					write: store.write,
					read: (variables) => readC(variables) as CacheResult<O.Option<N.ExtractModelType<R>>>,
					toRefs: (variables) => toRefsC(variables) as CacheResult<N.ExtractRefsType<R>>,
				})
			}
		}
	}
}
