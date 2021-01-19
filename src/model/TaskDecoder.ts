// expanded version of io-ts
import * as E from 'fp-ts/Either'
import { Refinement } from 'fp-ts/function'
import { isNonEmpty } from 'fp-ts/lib/Array'
import { pipe } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { fromNullable, Option } from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/TaskEither'
import * as TD from 'io-ts/TaskDecoder'
export * from 'io-ts/TaskDecoder'
import { Literal } from './Schemable'
import * as G from './Guard'
import * as D from './Decoder'

export interface TaskDecoder<I, A> {
	decode: (i: I) => TE.TaskEither<D.DecodeError, A>
}

export type DecodeError = D.DecodeError

export const error: (actual: unknown, message: string) => DecodeError = D.error

export const success: <A>(a: A) => TE.TaskEither<DecodeError, A> = TE.right

export const failure = <A = never>(actual: unknown, message: string): TE.TaskEither<DecodeError, A> =>
	TE.left(D.error(actual, message))

export const fromRefinement = <I, A extends I>(refinement: Refinement<I, A>, expected: string): TaskDecoder<I, A> => ({
	decode: (i) => {
		if (__DISABLE_VALIDATION__) {
			return success(i as A)
		} else {
			return refinement(i) ? success(i) : failure(i, expected)
		}
	}
})

export const fromGuard = <I, A extends I>(guard: G.Guard<I, A>, expected: string): TaskDecoder<I, A> =>
	fromRefinement(guard.is, expected)

export const literal = <A extends readonly [Literal, ...Array<Literal>]>(
	...values: A
): TaskDecoder<unknown, A[number]> =>
	/*#__PURE__*/ fromGuard(G.literal(...values), values.map((value) => JSON.stringify(value)).join(' | '))

export const string: TaskDecoder<string, string> =
	/*#__PURE__*/
	fromGuard(G.string, 'string')

export const number: TaskDecoder<number, number> =
	/*#__PURE__*/
	fromGuard(G.number, 'number')

export const int: TaskDecoder<number, G.Int> =
	/*#__PURE__*/
	fromGuard(G.int, 'integer')

export const float: TaskDecoder<number, G.Float> =
	/*#__PURE__*/
	fromGuard(G.float, 'float')

export const boolean: TaskDecoder<boolean, boolean> = /*#__PURE__*/ fromGuard(G.boolean, 'boolean')

export const UnknownArray: TaskDecoder<Array<unknown>, Array<unknown>> = /*#__PURE__*/ fromGuard(
	G.UnknownArray,
	'Array<unknown>'
)

export const UnknownRecord: TaskDecoder<unknown, Record<string, unknown>> = /*#__PURE__*/ fromGuard(
	G.UnknownRecord,
	'Record<string, unknown>'
)

export const mapLeftWithInput = TD.mapLeftWithInput

export const withMessage = TD.withMessage

export const refine = TD.refine

export const parse = TD.parse

export const nullable = TD.nullable

export const fromType = TD.fromType

export const type = TD.type

export const fromPartial = TD.fromPartial

export const partial = TD.partial

export const fromArray = TD.fromArray

export const array = TD.array

export const fromRecord = TD.fromRecord

export const record = TD.record

export const fromTuple = TD.fromTuple

export const tuple = TD.tuple

export const union = TD.union

export const intersect = TD.intersect

export const fromSum = TD.fromSum

export const sum = TD.sum

export const fromOption = <I, A>(a: TaskDecoder<I, A>): TaskDecoder<I, Option<A>> => {
	const d = nullable(a)
	return {
		decode: (i) => pipe(d.decode(i), TE.map(fromNullable))
	}
}

export const option = <A>(a: TaskDecoder<unknown, A>) => fromOption(a)

export const fromEither = <IL, IR, L, R>(
	l: TaskDecoder<IL, L>,
	r: TaskDecoder<IL, R>
): TaskDecoder<IL | IR, E.Either<L, R>> =>
	pipe(
		TD.map<R, E.Either<L, R>>(E.right)(r as TaskDecoder<IL | IR, R>),
		TD.alt(() => TD.map<L, E.Either<L, R>>(E.left)(l as TaskDecoder<IL | IR, L>))
	)

export const either = <L, R>(l: TaskDecoder<unknown, L>, r: TaskDecoder<unknown, R>) => fromEither(l, r)

const toMap = <K, A>(pairs: Array<[K, A]>) => new Map(pairs)

export const fromMap = <I, IK, IA, K, A>(toPairs: (i: I) => Array<[IK, IA]>) => {
	return (k: TaskDecoder<IK, K>, a: TaskDecoder<IA, A>): TaskDecoder<I, Map<K, A>> => {
		const d = fromArray(fromTuple(k, a))
		return {
			decode: (i) => pipe(toPairs(i), d.decode, TE.map(toMap))
		}
	}
}

export const map = (toPairs: (i: unknown) => Array<[unknown, unknown]>) => <K, A>(
	k: TaskDecoder<unknown, K>,
	a: TaskDecoder<unknown, A>
) => fromMap(toPairs)(k, a)

const toSet = <T>(values: Array<T>) => new Set(values)

export const fromSet = <I, A>(a: TaskDecoder<I, A>): TaskDecoder<I[], Set<A>> => {
	const d = fromArray(a)
	return {
		decode: (i) => pipe(d.decode(i), TE.map(toSet))
	}
}

export const set = <A>(a: TaskDecoder<unknown, A>) => fromSet(a)

export const fromNonEmptyArray = <I, A>(item: TaskDecoder<I, A>): TaskDecoder<Array<I>, NonEmptyArray<A>> => {
	return TD.compose(fromRefinement<Array<A>, NonEmptyArray<A>>(isNonEmpty, 'NonEmptyArray<A>'))(fromArray(item))
}

export const nonEmptyArray = <A>(item: TaskDecoder<unknown, A>): TaskDecoder<unknown, NonEmptyArray<any>> =>
	fromNonEmptyArray(item) as any

export const lazy = TD.lazy
