import {constant, Lazy} from 'fp-ts/lib/function'
import {Option} from 'fp-ts/lib/Option';

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

export const constEmptyString = constant('')

export interface Ref<T> {
	value: Option<T>
}
