import {constant, constVoid} from 'fp-ts/lib/function'
import {IO} from 'fp-ts/lib/IO'
import * as IOE from 'fp-ts/lib/IOEither'
import {Monoid} from 'fp-ts/lib/Monoid'
import {getSemigroup, NonEmptyArray} from 'fp-ts/lib/NonEmptyArray'
import {none} from 'fp-ts/lib/Option'
import {Tree} from 'fp-ts/lib/Tree'
import {Option} from 'fp-ts/Option';
import {Task} from 'fp-ts/Task';
import {TaskEither} from 'fp-ts/TaskEither';

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

export const cacheErrorApplicativeValidation = IOE.getIOValidation(getSemigroup<Tree<string>>())




export interface CacheResult<T> extends IO<T> {}

export interface Evict extends IO<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export interface Persist {
	store(key: string, value: unknown): TaskEither<CacheError, void>
	restore<T>(key: string): TaskEither<CacheError, Option<T>>
}

