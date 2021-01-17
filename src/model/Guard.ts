import {Either, Left, Right} from 'fp-ts/Either';
import {isNonEmpty} from 'fp-ts/lib/Array';
import {NonEmptyArray} from 'fp-ts/lib/NonEmptyArray';
import {None, Option, Some} from 'fp-ts/lib/Option';
import * as G from 'io-ts/Guard';
export * from 'io-ts/Guard'

export interface IntBrand {
	readonly Int: unique symbol
}

export type Int = number & IntBrand

export const int: G.Guard<unknown, Int> = {
	is: (u): u is Int => G.number.is(u) && Number.isInteger(u)
}

export interface FloatBrand {
	readonly Float: unique symbol
}

export type Float = number & FloatBrand

export const float: G.Guard<unknown, Float> = {
	is: (u): u is Float => G.number.is(u) && !Number.isInteger(u)
}

export const none: G.Guard<unknown, None> = G.type({ _tag: G.literal('None')} );

export const some = <A>(value: G.Guard<unknown, A>): G.Guard<unknown, Some<A>> => G.type({
	_tag: G.literal('Some'),
	value
});

export const option = <A>(value: G.Guard<unknown, A>): G.Guard<unknown, Option<A>> => G.sum('_tag')({
	None: none,
	Some: some(value)
});

export const left = <A>(left: G.Guard<unknown, A>): G.Guard<unknown, Left<A>> => G.type({
	_tag: G.literal('Left'),
	left
});

export const right = <A>(right: G.Guard<unknown, A>): G.Guard<unknown, Right<A>> => G.type({
	_tag: G.literal('Right'),
	right
});

export const either = <L, R>(l: G.Guard<unknown, L>, r: G.Guard<unknown, R>): G.Guard<unknown, Either<L, R>> => G.sum('_tag')({
	Left: left(l),
	Right: right(r)
});

export const map = <K, A>(k: G.Guard<unknown, K>, a: G.Guard<unknown, A>): G.Guard<unknown, Map<K, A>> => ({
	is: (u: unknown): u is Map<K, A> => {
		if (typeof Map === undefined || !(u instanceof Map)) { return false;}
		for (const [key, value] of u.entries()) {
			if (!k.is(key) || !a.is(value)) {
				return false
			}
		}
		return true
	}
})

export const set = <A>(item: G.Guard<unknown, A>): G.Guard<unknown, Set<A>> => ({
	is: (u: unknown): u is Set<A> => {
		if (typeof Set === undefined || !(u instanceof Set)) { return false;}
		for (const value of u.values()) {
			if (!item.is(value)) {
				return false
			}
		}
		return true
	}
});

export const nonEmptyArray = <A>(item: G.Guard<unknown, A>): G.Guard<unknown, NonEmptyArray<A>> => {
	const arr = G.array(item);
	return {
		is: (u: unknown): u is NonEmptyArray<A> => arr.is(u) && isNonEmpty(u)
	};

}

