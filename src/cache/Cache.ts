import { isNonEmpty } from 'fp-ts/lib/Array'
import { right } from 'fp-ts/lib/Either'
import { left } from 'fp-ts/lib/IOEither'
import { of } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { Reader } from 'fp-ts/lib/Reader'
import { tree } from 'io-ts/lib/Decoder'
import * as N from '../node/Node'
import { CacheError, CacheResult, CacheWriteResult, Persist } from '../shared'
import { validate } from './validate'

export interface CacheDependencies {
	id?: string
	persist?: Persist
}

export interface Cache<R> {
	write(variables: N.TypeOfMergedVariables<R>): Reader<N.TypeOfPartial<R>, CacheWriteResult>
	read(variables: N.TypeOfMergedVariables<R>): CacheResult<O.Option<N.TypeOf<R>>>
	toRefs(variables: N.TypeOfMergedVariables<R>): CacheResult<N.TypeOfRefs<R>>
}

export interface RequestCache<R> extends Reader<R, Cache<R>> {}

const TEMP_CACHE_RESULT: CacheResult<any> = left(of(tree('cache not yet implemented')))

export function make<S extends N.SchemaNode<any, any>>(c: S) {
	return (_: CacheDependencies) => {
		return <R extends N.SchemaNode<any, any>>(r: R) => {
			const errors = validate(c, r)
			if (isNonEmpty(errors)) {
				return left<CacheError, Cache<R>>(errors)
			} else {
				return right<CacheError, Cache<R>>({
					write: (_) => (_) => TEMP_CACHE_RESULT,
					read: (_) => TEMP_CACHE_RESULT,
					toRefs: (_) => TEMP_CACHE_RESULT
				})
			}
		}
	}
}
