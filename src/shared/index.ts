import { IO } from 'fp-ts/IO'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Tree } from 'fp-ts/Tree'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'

export function isEmptyObject(obj: object): obj is {} {
	return Object.keys(obj).length === 0
}

export function isEmptyString(x: any) {
	return x === ''
}

export interface CacheResult<T> extends IO<T> {}

export interface Evict extends IO<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export interface Persist {
	store(key: string, value: unknown): TaskEither<CacheError, void>
	restore<T>(key: string): TaskEither<CacheError, Option<T>>
}
