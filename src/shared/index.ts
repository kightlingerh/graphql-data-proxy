import { constant, constVoid } from 'fp-ts/lib/function'
import { IO } from 'fp-ts/lib/IO'
import * as IOE from 'fp-ts/lib/IOEither'
import { Monoid } from 'fp-ts/lib/Monoid'
import { getSemigroup, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as O from 'fp-ts/lib/Option'
import { none } from 'fp-ts/lib/Option'
import { Tree } from 'fp-ts/lib/Tree'

export function isEmptyObject(obj: object): obj is {} {
	return Object.keys(obj).length === 0
}

export function isEmptyString(x: any) {
	return x === ''
}

export const constEmptyString = constant('')

export const constEmptyArray = constant([])

export const constMap = constant(new Map())

export const constNone = constant(none)

export function isFunction(u: unknown): u is Function {
	return typeof u === 'function'
}

export const OPEN_BRACKET = '{'

export const CLOSE_BRACKET = '}'

export const OPEN_PAREN = '('

export const CLOSE_PAREN = ')'

export const COLON = ':'

export const DOLLAR_SIGN = '$'

export const EXCLAMATION = '!'

export const ELLIPSIS = '...'

export const OPEN_SPACE = ' '

export const TYPENAME = '__typename'

export const ON = 'on'
export const cacheErrorApplicativeValidation = IOE.getIOValidation(getSemigroup<Tree<string>>())

export interface CacheWriteResult extends CacheResult<Evict> {}

export interface CacheResult<T> extends IO<T> {}

export interface Evict extends IO<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export const cacheWriteResultMonoid: Monoid<CacheWriteResult> = {
	empty: constant(constVoid),
	concat: (x, y) => {
		return () => () => {
			x()
			y()
		}
	}
}

export async function taskVoid() {}

export function concatEvict(x: Evict, y: Evict): Evict {
	return () => {
		x()
		y()
	}
}

export interface Persist {
	store(key: string, value: string): IOE.IOEither<CacheError, void>
	restore<T>(key: string): IOE.IOEither<CacheError, O.Option<T>>
}
