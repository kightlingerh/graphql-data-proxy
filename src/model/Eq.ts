import { getEq as getEqEither } from 'fp-ts/lib/Either'
import { getEq as getEqNonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { getEq as getEqOption } from 'fp-ts/lib/Option'
import { getEq as getEqMap } from 'fp-ts/lib/Map'
import { getEq as getEqSet } from 'fp-ts/lib/Set'
import { Eq } from 'fp-ts/lib/Eq'
import {
	number,
	string,
	boolean,
	array,
	type,
	partial,
	nullable,
	lazy,
	sum,
	tuple,
	UnknownRecord,
	UnknownArray,
	record,
	intersect
} from 'io-ts/lib/Eq'
import { Float, Int } from './Guard'

export {
	Eq,
	number,
	string,
	boolean,
	array,
	type,
	partial,
	nullable,
	lazy,
	sum,
	tuple,
	UnknownRecord,
	UnknownArray,
	record,
	intersect
}

export const int: Eq<Int> = number

export const float: Eq<Float> = number

export const option = getEqOption

export const either = getEqEither

export const map = getEqMap

export const set = getEqSet

export const nonEmptyArray = getEqNonEmptyArray
