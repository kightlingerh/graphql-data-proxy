import { constant, Lazy } from 'fp-ts/lib/function'
import { Option } from 'fp-ts/lib/Option'

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

export function isEmptyString(str: string) {
	return str === ''
}

export const constEmptyString = constant('')

export interface Ref<T> {
	value: Option<T>
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
