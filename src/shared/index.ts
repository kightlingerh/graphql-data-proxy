import * as E from 'fp-ts/lib/Either'
import { constant, Lazy } from 'fp-ts/lib/function'
import { Monoid } from 'fp-ts/lib/Monoid'
import { getSemigroup } from 'fp-ts/lib/NonEmptyArray'
import { Option, Some } from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/lib/TaskEither'
import { Tree } from 'fp-ts/lib/Tree'
import { CacheError, CacheWriteResult, Evict } from '../node'

export function isEmptyObject(obj: object): obj is {} {
	return Object.keys(obj).length === 0
}

export function once<T>(fn: Lazy<T>): Lazy<T> {
	let result: T
	return () => {
		if (result) {
			return result
		} else {
			result = fn()
			return result
		}
	}
}

export function isEmptyString(x: any) {
	return x === ''
}

export const constEmptyString = constant('')

export interface Ref<T> {
	value: Option<T>
}

export interface SomeRef<T> {
	value: Some<T>
}

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
export const cacheErrorApplicativeValidation = TE.getTaskValidation(getSemigroup<Tree<string>>())
export const cacheWriteResultMonoid: Monoid<CacheWriteResult> = {
	empty: TE.right(taskVoid),
	concat: (x, y) => {
		return (async () => {
			const [xResult, yResult] = await Promise.all([x(), y()])
			if (E.isLeft(xResult) && E.isLeft(yResult)) {
				return E.left([...xResult.left, ...yResult.left] as CacheError)
			} else if (E.isLeft(xResult) && E.isRight(yResult)) {
				yResult.right()
				return xResult
			} else if (E.isLeft(yResult) && E.isRight(xResult)) {
				xResult.right()
				return yResult
			} else if (E.isRight(xResult) && E.isRight(yResult)) {
				return E.right(async () => {
					await Promise.all([x(), y()])
				})
			} else {
				return cacheWriteResultMonoid.empty
			}
		}) as CacheWriteResult
	}
}

export async function taskVoid() {}

export function concatEvict(x: Evict, y: Evict): Evict {
	return async () => {
		await Promise.all([x(), y()])
	}
}
