import { isEmpty, isNonEmpty } from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import { pipe, Refinement } from 'fp-ts/function'
import { fold, NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { none, Option, some } from 'fp-ts/Option'
import * as D from 'io-ts/Decoder'
import * as DE from './DecodeError'
import * as G from './Guard'
import { Literal } from './Schemable'

export * from 'io-ts/Decoder'

export const fromRefinement = <I, A extends I>(refinement: Refinement<I, A>, expected: string): D.Decoder<I, A> => ({
	decode: (i) => {
		if (__DISABLE_VALIDATION__) {
			return D.success(i as A)
		} else {
			return refinement(i) ? D.success(i) : D.failure(i, expected)
		}
	}
})

export const fromGuard = <I, A extends I>(guard: G.Guard<I, A>, expected: string): D.Decoder<I, A> =>
	fromRefinement(guard.is, expected)

export const literal = <A extends readonly [Literal, ...Array<Literal>]>(...values: A): D.Decoder<unknown, A[number]> =>
	/*#__PURE__*/ fromGuard(G.literal(...values), values.map((value) => JSON.stringify(value)).join(' | '))

export const string: D.Decoder<string, string> =
	/*#__PURE__*/
	fromGuard(G.string, 'string')

const numberFromString: D.Decoder<number | string, number> = {
	decode: (i) => {
		if (__DISABLE_VALIDATION__) {
			return G.number.is(i) ? E.right(i) : (E.right(parseFloat(i)) as E.Either<D.DecodeError, number>)
		}
		if (G.number.is(i)) {
			return E.right(i) as E.Either<D.DecodeError, number>
		} else {
			const val = parseFloat(i)
			return Number.isNaN(val)
				? E.left(D.error(i, 'expect a number or string representing a number'))
				: (E.right(val) as E.Either<D.DecodeError, number>)
		}
	}
}

export const number: D.Decoder<number, number> =
	/*#__PURE__*/
	fromGuard(G.number, 'number')

export const int: D.Decoder<number, G.Int> =
	/*#__PURE__*/
	D.compose(fromGuard(G.int, 'integer'))(numberFromString)

export const float: D.Decoder<number, G.Float> =
	/*#__PURE__*/
	D.compose(fromGuard(G.float, 'float'))(numberFromString)

export const boolean: D.Decoder<boolean, boolean> = /*#__PURE__*/ fromGuard(G.boolean, 'boolean')

export const UnknownArray: D.Decoder<Array<unknown>, Array<unknown>> = /*#__PURE__*/ fromGuard(
	G.UnknownArray,
	'Array<unknown>'
)

export const UnknownRecord: D.Decoder<unknown, Record<string, unknown>> = /*#__PURE__*/ fromGuard(
	G.UnknownRecord,
	'Record<string, unknown>'
)

export const fromOption = <I, A>(a: D.Decoder<I, A>): D.Decoder<I | null | undefined, Option<A>> => {
	return {
		decode: (i) => {
			if (i === null || i === undefined) {
				return D.success(none as Option<A>)
			} else {
				return pipe(a.decode(i), E.map(some))
			}
		}
	}
}

export const option = <A>(a: D.Decoder<unknown, A>) => fromOption(a)

export const fromEither = <IL, IR, L, R>(
	l: D.Decoder<IL, L>,
	r: D.Decoder<IR, R>
): D.Decoder<IL | IR, E.Either<L, R>> =>
	pipe(
		D.map<R, E.Either<L, R>>(E.right)(r as D.Decoder<IL | IR, R>),
		D.alt(() => D.map<L, E.Either<L, R>>(E.left)(l as D.Decoder<IL | IR, L>))
	)

export const either = <L, R>(l: D.Decoder<unknown, L>, r: D.Decoder<unknown, R>) => fromEither(l, r)

export const fromMap = <I, IK, IA, K, A>(toPairs: (input: I) => Array<[IK, IA]>) => (
	k: D.Decoder<IK, K>,
	a: D.Decoder<IA, A>
): D.Decoder<I, Map<K, A>> => {
	return {
		decode: (i) => {
			const decodedMap = new Map<K, A>()
			const errors: D.DecodeError[] = []
			for (const [key, value] of toPairs(i)) {
				const decodedKey = k.decode(key as IK)
				const decodedValue = a.decode(value as IA)
				if (isEmpty(errors) && E.isRight(decodedKey) && E.isRight(decodedValue)) {
					decodedMap.set(decodedKey.right, decodedValue.right)
				} else {
					if (E.isLeft(decodedKey)) {
						errors.push(decodedKey.left)
					}
					if (E.isLeft(decodedValue)) {
						errors.push(decodedValue.left)
					}
				}
			}

			if (isNonEmpty(errors)) {
				return E.left(fold(DE.getSemigroup<string>())(errors))
			}
			return E.right(decodedMap)
		}
	}
}

export const map = <K, A>(toPairs: (input: unknown) => Array<[unknown, unknown]>) => (
	k: D.Decoder<unknown, K>,
	a: D.Decoder<unknown, A>
): D.Decoder<unknown, Map<K, A>> => fromMap<unknown, unknown, unknown, K, A>(toPairs)(k, a)

const toSet = <T>(values: Array<T>) => new Set(values)

export const fromSet = <I, A>(a: D.Decoder<I, A>): D.Decoder<I[], Set<A>> => {
	const d = D.fromArray(a)
	return {
		decode: (i) => pipe(d.decode(i), E.map(toSet))
	}
}

export const set = <A>(a: D.Decoder<unknown, A>) => fromSet(a)

export const fromNonEmptyArray = <I, A>(item: D.Decoder<I, A>): D.Decoder<Array<I>, NonEmptyArray<A>> => {
	return D.compose(fromRefinement<Array<A>, NonEmptyArray<A>>(isNonEmpty, 'NonEmptyArray<A>'))(D.fromArray(item))
}

export const nonEmptyArray = <A>(item: D.Decoder<unknown, A>): D.Decoder<unknown, NonEmptyArray<any>> =>
	fromNonEmptyArray(item) as any
