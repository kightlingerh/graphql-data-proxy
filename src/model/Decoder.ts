import { map as mapE, Either, right, left, isRight, isLeft } from 'fp-ts/lib/Either'
import { isEmpty, isNonEmpty } from 'fp-ts/lib/Array'
import { pipe, Refinement } from 'fp-ts/lib/function'
import { fold, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { none, Option, some } from 'fp-ts/lib/Option'
import { getSemigroup } from 'io-ts/lib/DecodeError'
import {
	Decoder,
	success,
	failure,
	compose,
	error,
	DecodeError,
	map as mapD,
	alt,
	fromArray,
	array,
	id,
	fromType,
	type,
	fromSum,
	sum,
	fromPartial,
	partial,
	InputOf,
	TypeOf,
	fromTuple,
	tuple,
	nullable,
	lazy,
	fromRecord,
	record
} from 'io-ts/lib/Decoder'
import {
	Guard,
	string as stringGuard,
	number as numberGuard,
	literal as literalGuard,
	Int,
	int as intGuard,
	float as floatGuard,
	Float,
	boolean as booleanGuard,
	UnknownArray as UnknownArrayGuard,
	UnknownRecord as UnknownRecordGuard
} from './Guard'
import { Literal } from './Schemable'

export {
	Decoder,
	success,
	failure,
	compose,
	error,
	DecodeError,
	fromArray,
	array,
	id,
	fromType,
	type,
	fromSum,
	sum,
	fromPartial,
	partial,
	InputOf,
	TypeOf,
	fromTuple,
	tuple,
	nullable,
	lazy,
	record,
	fromRecord
}

export const fromRefinement = <I, A extends I>(refinement: Refinement<I, A>, expected: string): Decoder<I, A> => ({
	decode: (i) => {
		if (__DISABLE_VALIDATION__) {
			return success(i as A)
		} else {
			return refinement(i) ? success(i) : failure(i, expected)
		}
	}
})

export const fromGuard = <I, A extends I>(guard: Guard<I, A>, expected: string): Decoder<I, A> =>
	fromRefinement(guard.is, expected)

export const literal = <A extends readonly [Literal, ...Array<Literal>]>(...values: A): Decoder<unknown, A[number]> =>
	/*#__PURE__*/ fromGuard(literalGuard(...values), values.map((value) => JSON.stringify(value)).join(' | '))

export const string: Decoder<string, string> =
	/*#__PURE__*/
	fromGuard(stringGuard, 'string')

const numberFromString: Decoder<number | string, number> = {
	decode: (i) => {
		if (__DISABLE_VALIDATION__) {
			return numberGuard.is(i) ? success(i) : success(parseFloat(i))
		}
		if (numberGuard.is(i)) {
			return success(i)
		} else {
			const val = parseFloat(i)
			return Number.isNaN(val) ? failure(i, 'expect a number or string representing a number') : success(val)
		}
	}
}

export const number: Decoder<number, number> =
	/*#__PURE__*/
	fromGuard(numberGuard, 'number')

export const int: Decoder<number, Int> =
	/*#__PURE__*/
	compose(fromGuard(intGuard, 'integer'))(numberFromString)

export const float: Decoder<number, Float> =
	/*#__PURE__*/
	compose(fromGuard(floatGuard, 'float'))(numberFromString)

export const boolean: Decoder<boolean, boolean> = /*#__PURE__*/ fromGuard(booleanGuard, 'boolean')

export const UnknownArray: Decoder<Array<unknown>, Array<unknown>> = /*#__PURE__*/ fromGuard(
	UnknownArrayGuard,
	'Array<unknown>'
)

export const UnknownRecord: Decoder<unknown, Record<string, unknown>> = /*#__PURE__*/ fromGuard(
	UnknownRecordGuard,
	'Record<string, unknown>'
)

export const fromOption = <I, A>(a: Decoder<I, A>): Decoder<I | null | undefined, Option<A>> => {
	return {
		decode: (i) => {
			if (i === null || i === undefined) {
				return success(none as Option<A>)
			} else {
				return pipe(a.decode(i), mapE(some))
			}
		}
	}
}

export const option = <A>(a: Decoder<unknown, A>) => fromOption(a)

export const fromEither = <IL, IR, L, R>(l: Decoder<IL, L>, r: Decoder<IR, R>): Decoder<IL | IR, Either<L, R>> =>
	pipe(
		mapD<R, Either<L, R>>(right)(r as Decoder<IL | IR, R>),
		alt(() => mapD<L, Either<L, R>>(left)(l as Decoder<IL | IR, L>))
	)

export const either = <L, R>(l: Decoder<unknown, L>, r: Decoder<unknown, R>) => fromEither(l, r)

export const fromMap = <I, IK, IA, K, A>(toPairs: (input: I) => Array<[IK, IA]>) => (
	k: Decoder<IK, K>,
	a: Decoder<IA, A>
): Decoder<I, Map<K, A>> => {
	return {
		decode: (i) => {
			const decodedMap = new Map<K, A>()
			const errors: DecodeError[] = []
			for (const [key, value] of toPairs(i)) {
				const decodedKey = k.decode(key as IK)
				const decodedValue = a.decode(value as IA)
				if (isEmpty(errors) && isRight(decodedKey) && isRight(decodedValue)) {
					decodedMap.set(decodedKey.right, decodedValue.right)
				} else {
					if (isLeft(decodedKey)) {
						errors.push(decodedKey.left)
					}
					if (isLeft(decodedValue)) {
						errors.push(decodedValue.left)
					}
				}
			}

			if (isNonEmpty(errors)) {
				return left(fold(getSemigroup<string>())(errors))
			}
			return right(decodedMap)
		}
	}
}

export const map = <K, A>(toPairs: (input: unknown) => Array<[unknown, unknown]>) => (
	k: Decoder<unknown, K>,
	a: Decoder<unknown, A>
): Decoder<unknown, Map<K, A>> => fromMap<unknown, unknown, unknown, K, A>(toPairs)(k, a)

const toSet = <T>(values: Array<T>) => new Set(values)

export const fromSet = <I, A>(a: Decoder<I, A>): Decoder<I[], Set<A>> => {
	const d = fromArray(a)
	return {
		decode: (i) => pipe(d.decode(i), mapE(toSet))
	}
}

export const set = <A>(a: Decoder<unknown, A>) => fromSet(a)

export const fromNonEmptyArray = <I, A>(item: Decoder<I, A>): Decoder<Array<I>, NonEmptyArray<A>> => {
	return compose(fromRefinement<Array<A>, NonEmptyArray<A>>(isNonEmpty, 'NonEmptyArray<A>'))(fromArray(item))
}

export const nonEmptyArray = <A>(item: Decoder<unknown, A>): Decoder<unknown, NonEmptyArray<any>> =>
	fromNonEmptyArray(item) as any
