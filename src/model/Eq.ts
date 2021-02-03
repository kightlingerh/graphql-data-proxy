import { getEq as getEqEither } from 'fp-ts/lib/Either'
import { getEq as getEqNonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { getEq as getEqOption } from 'fp-ts/lib/Option'
import { getEq as getEqMap } from 'fp-ts/lib/Map'
import { getEq as getEqSet } from 'fp-ts/lib/Set'
import * as EQ from 'io-ts/Eq'
import { Float, Int } from './Guard'
export * from 'io-ts/Eq'

export interface Eq<A> {
	readonly equals: (x: A, y: A) => boolean
}

export const int: Eq<Int> = EQ.number

export const float: Eq<Float> = EQ.number

export const option = getEqOption

export const either = getEqEither

export const map = getEqMap

export const set = getEqSet

export const nonEmptyArray = getEqNonEmptyArray
