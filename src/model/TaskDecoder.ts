import { Either, right, isRight, isLeft, left } from 'fp-ts/lib/Either';
import { map as teMap } from 'fp-ts/lib/TaskEither';
import { Refinement } from 'fp-ts/lib/function';
import { isNonEmpty } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { none, Option, some } from 'fp-ts/lib/Option';
import {
	TaskDecoder,
	error,
	success,
	failure,
	compose,
	fromType,
	type,
	fromPartial,
	partial,
	fromArray,
	array,
	fromRecord,
	record,
	fromTuple,
	tuple,
	union,
	intersect,
	fromSum,
	sum,
	map as tdMap,
	alt,
	lazy,
	literal
} from 'io-ts/lib/TaskDecoder';
import { getSemigroup } from './DecodeError';
import {
	number as numberGuard,
	string as stringGuard,
	Guard,
	int as intGuard,
	float as floatGuard,
	boolean as booleanGuard,
	UnknownArray as UnknownArrayGuard,
	UnknownRecord as UnknownRecordGuard,
	Int,
	Float
} from './Guard';
import { DecodeError } from './Decoder';

export {
	TaskDecoder,
	literal,
	error,
	success,
	failure,
	compose,
	fromType,
	type,
	fromPartial,
	partial,
	fromArray,
	array,
	fromRecord,
	record,
	fromTuple,
	tuple,
	union,
	intersect,
	fromSum,
	sum,
	lazy
};

export const fromRefinement = <I, A extends I>(refinement: Refinement<I, A>, expected: string): TaskDecoder<I, A> => ({
	decode: (i) => {
		if (__DISABLE_VALIDATION__) {
			return success(i as A);
		} else {
			return refinement(i) ? success(i) : failure(i, expected);
		}
	}
});

export const fromGuard = <I, A extends I>(guard: Guard<I, A>, expected: string): TaskDecoder<I, A> =>
	fromRefinement(guard.is, expected);

export const string: TaskDecoder<string, string> =
	/*#__PURE__*/
	fromGuard(stringGuard, 'string');

const numberFromString: TaskDecoder<number | string, number> = {
	decode: (i) => {
		if (__DISABLE_VALIDATION__) {
			return numberGuard.is(i) ? success(i) : success(parseFloat(i));
		}
		if (numberGuard.is(i)) {
			return success(i);
		} else {
			const val = parseFloat(i);
			return Number.isNaN(val) ? failure(i, 'expect a number or string representing a number') : success(val);
		}
	}
};

export const number: TaskDecoder<number, number> =
	/*#__PURE__*/
	fromGuard(numberGuard, 'number');

export const int: TaskDecoder<number, Int> =
	/*#__PURE__*/
	compose(fromGuard(intGuard, 'integer'))(numberFromString);

export const float: TaskDecoder<number, Float> =
	/*#__PURE__*/
	compose(fromGuard(floatGuard, 'float'))(numberFromString);

export const boolean: TaskDecoder<boolean, boolean> = /*#__PURE__*/ fromGuard(booleanGuard, 'boolean');

export const UnknownArray: TaskDecoder<Array<unknown>, Array<unknown>> = /*#__PURE__*/ fromGuard(
	UnknownArrayGuard,
	'Array<unknown>'
);

export const UnknownRecord: TaskDecoder<unknown, Record<string, unknown>> = /*#__PURE__*/ fromGuard(
	UnknownRecordGuard,
	'Record<string, unknown>'
);

export const fromOption = <I, A>(a: TaskDecoder<I, A>): TaskDecoder<I | null | undefined, Option<A>> => {
	return {
		decode: (i) => {
			if (i === null || i === undefined) {
				return success(none);
			} else {
				return pipe(a.decode(i), teMap(some));
			}
		}
	};
};

export const option = <A>(a: TaskDecoder<unknown, A>) => fromOption(a);

export const fromEither = <IL, IR, L, R>(
	l: TaskDecoder<IL, L>,
	r: TaskDecoder<IR, R>
): TaskDecoder<IL | IR, Either<L, R>> =>
	pipe(
		tdMap<R, Either<L, R>>(right)(r as TaskDecoder<IL | IR, R>),
		alt(() => tdMap<L, Either<L, R>>(left)(l as TaskDecoder<IL | IR, L>))
	);

export const either = <L, R>(l: TaskDecoder<unknown, L>, r: TaskDecoder<unknown, R>) => fromEither(l, r);

const mergeErrors = getSemigroup<string>().concat;

export const fromMap = <I, IK, IA, K, A>(toPairs: (input: I) => Array<[IK, IA]>) => (
	k: TaskDecoder<IK, K>,
	a: TaskDecoder<IA, A>
): TaskDecoder<I, Map<K, A>> => {
	return {
		decode: (i) => {
			return async () => {
				const pairs: Promise<[Either<DecodeError, K>, Either<DecodeError, A>]>[] = [];
				for (const [key, value] of toPairs(i)) {
					pairs.push(Promise.all([k.decode(key as IK)(), a.decode(value as IA)()]));
				}
				const awaitedPairs = await Promise.all(pairs);
				const extractedPairs: [K, A][] = [];
				let error: DecodeError | null = null;
				for (let i = 0; i < awaitedPairs.length; i++) {
					const [key, value] = awaitedPairs[i];
					if (!__DISABLE_VALIDATION__) {
						if (isLeft(key)) {
							error = error ? mergeErrors(error, key.left) : key.left;
						}
						if (isLeft(value)) {
							error = error ? mergeErrors(error, value.left) : value.left;
						}
					}
					if (isRight(key) && isRight(value)) {
						extractedPairs.push([key.right, value.right]);
					}
				}
				if (error) {
					return left(error);
				}
				return right(new Map(extractedPairs));
			};
		}
	};
};

export const map = <K, A>(toPairs: (input: unknown) => Array<[unknown, unknown]>) => (
	k: TaskDecoder<unknown, K>,
	a: TaskDecoder<unknown, A>
): TaskDecoder<unknown, Map<K, A>> => fromMap<unknown, unknown, unknown, K, A>(toPairs)(k, a);

const toSet = <T>(values: Array<T>) => new Set(values);

export const fromSet = <I, A>(a: TaskDecoder<I, A>): TaskDecoder<I[], Set<A>> => {
	const d = fromArray(a);
	return {
		decode: (i) => pipe(d.decode(i), teMap(toSet))
	};
};

export const set = <A>(a: TaskDecoder<unknown, A>) => fromSet(a);

export const fromNonEmptyArray = <I, A>(item: TaskDecoder<I, A>): TaskDecoder<Array<I>, NonEmptyArray<A>> => {
	return compose(fromRefinement<Array<A>, NonEmptyArray<A>>(isNonEmpty, 'NonEmptyArray<A>'))(fromArray(item));
};

export const nonEmptyArray = <A>(item: TaskDecoder<unknown, A>): TaskDecoder<unknown, NonEmptyArray<any>> =>
	fromNonEmptyArray(item) as any;
