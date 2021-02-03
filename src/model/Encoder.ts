import { Either, fold as foldE } from 'fp-ts/lib/Either'
import { constNull, Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { fold, Option } from 'fp-ts/lib/Option'
import * as EN from 'io-ts/Encoder'
import { Float, Int } from './Guard'
export * from 'io-ts/Encoder'

export const string = EN.id<string>()

export const boolean = EN.id<boolean>()

export const number = EN.id<number>()

export const int = EN.id<Int>()

export const float = EN.id<Float>()

export function option<O, A>(item: EN.Encoder<O, A>): EN.Encoder<O | null, Option<A>>
export function option<O, A>(item: EN.Encoder<O, A>, lazy: Lazy<O>): EN.Encoder<O, Option<A>>
export function option<O, A>(item: EN.Encoder<O, A>, lazy?: Lazy<O>) {
	return {
		encode: fold(lazy ?? constNull, item.encode)
	}
}

export const either = <OL, OR, L, R>(
	l: EN.Encoder<OL, L>,
	r: EN.Encoder<OR, R>
): EN.Encoder<OL | OR, Either<L, R>> => ({
	encode: foldE<L, R, OL | OR>((l as EN.Encoder<OL | OR, L>).encode, (r as EN.Encoder<OL | OR, R>).encode)
})

export const map = <O, OK, OA, K, A>(fromPairs: (pairs: Array<[OK, OA]>) => O) => (
	k: EN.Encoder<OK, K>,
	a: EN.Encoder<OA, A>
): EN.Encoder<O, Map<K, A>> => ({
	encode: (i) => {
		const pairs: Array<[OK, OA]> = []
		for (const [key, value] of i.entries()) {
			pairs.push([k.encode(key), a.encode(value)])
		}
		return fromPairs(pairs)
	}
})

export const set = <O, A>(item: EN.Encoder<O, A>): EN.Encoder<O[], Set<A>> => ({
	encode: (i) => {
		const values: O[] = []
		i.forEach((value) => {
			values.push(item.encode(value))
		})
		return values
	}
})

export const nonEmptyArray = <O, A>(item: EN.Encoder<O, A>): EN.Encoder<Array<O>, NonEmptyArray<A>> =>
	EN.array(item) as any
