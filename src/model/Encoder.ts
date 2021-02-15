import { Either, fold as foldE } from 'fp-ts/lib/Either'
import { constNull, Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { fold, Option } from 'fp-ts/lib/Option'
import { Encoder, OutputOf, id, array, type, partial, sum, lazy, nullable, tuple, record } from 'io-ts/lib/Encoder';
import { Float, Int } from './Guard'

export {
	id,
	Encoder,
	array,
	type,
	partial,
	sum,
	lazy,
	nullable,
	OutputOf,
	tuple,
	record
}

export const literal = id

export const string = id<string>()

export const boolean = id<boolean>()

export const number = id<number>()

export const int = id<Int>()

export const float = id<Float>()

export function option<O, A>(item: Encoder<O, A>): Encoder<O | null, Option<A>>
export function option<O, A>(item: Encoder<O, A>, lazy: Lazy<O>): Encoder<O, Option<A>>
export function option<O, A>(item: Encoder<O, A>, lazy?: Lazy<O>) {
	return {
		encode: fold(lazy ?? constNull, item.encode)
	}
}

export const either = <OL, OR, L, R>(
	l: Encoder<OL, L>,
	r: Encoder<OR, R>
): Encoder<OL | OR, Either<L, R>> => ({
	encode: foldE<L, R, OL | OR>((l as Encoder<OL | OR, L>).encode, (r as Encoder<OL | OR, R>).encode)
})

export const map = <O, OK, OA, K = OK, A = OA>(fromPairs: (pairs: Array<[OK, OA]>) => O) => (
	k: Encoder<OK, K>,
	a: Encoder<OA, A>
): Encoder<O, Map<K, A>> => ({
	encode: (i) => {
		const pairs: Array<[OK, OA]> = []
		for (const [key, value] of i.entries()) {
			pairs.push([k.encode(key), a.encode(value)])
		}
		return fromPairs(pairs)
	}
})

export const set = <O, A>(item: Encoder<O, A>): Encoder<O[], Set<A>> => ({
	encode: (i) => {
		const values: O[] = []
		i.forEach((value) => {
			values.push(item.encode(value))
		})
		return values
	}
})

export const nonEmptyArray = <O, A>(item: Encoder<O, A>): Encoder<Array<O>, NonEmptyArray<A>> =>
	array(item) as any
