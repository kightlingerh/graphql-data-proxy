import { Either, Left, Right } from 'fp-ts/lib/Either';
import { isNonEmpty } from 'fp-ts/lib/Array';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { None, Option, Some } from 'fp-ts/lib/Option';
import {
	Guard,
	number,
	type,
	literal,
	sum,
	UnknownArray,
	UnknownRecord,
	array,
	record,
	partial,
	lazy,
	boolean,
	string,
	nullable,
	tuple
} from 'io-ts/lib/Guard';

export {
	Guard,
	number,
	type,
	literal,
	sum,
	array,
	UnknownRecord,
	UnknownArray,
	record,
	partial,
	lazy,
	boolean,
	string,
	nullable,
	tuple
};

export type Int = number;

export const int: Guard<unknown, Int> = {
	is: (u): u is Int => number.is(u) && Number.isInteger(u)
};

export type Float = number;

export const float: Guard<unknown, Float> = {
	is: (u): u is Float => number.is(u)
};

export const none: Guard<unknown, None> = type({ _tag: literal('None') });

export const some = <A>(value: Guard<unknown, A>): Guard<unknown, Some<A>> =>
	type({
		_tag: literal('Some'),
		value
	});

export const option = <A>(value: Guard<unknown, A>): Guard<unknown, Option<A>> =>
	sum('_tag')({
		None: none,
		Some: some(value)
	});

export const left = <A>(left: Guard<unknown, A>): Guard<unknown, Left<A>> =>
	type({
		_tag: literal('Left'),
		left
	});

export const right = <A>(right: Guard<unknown, A>): Guard<unknown, Right<A>> =>
	type({
		_tag: literal('Right'),
		right
	});

export const either = <L, R>(l: Guard<unknown, L>, r: Guard<unknown, R>): Guard<unknown, Either<L, R>> =>
	sum('_tag')({
		Left: left(l),
		Right: right(r)
	});

export const map = <K, A>(k: Guard<unknown, K>, a: Guard<unknown, A>): Guard<unknown, Map<K, A>> => ({
	is: (u: unknown): u is Map<K, A> => {
		if (typeof Map === undefined || !(u instanceof Map)) {
			return false;
		}
		for (const [key, value] of u.entries()) {
			if (!k.is(key) || !a.is(value)) {
				return false;
			}
		}
		return true;
	}
});

export const set = <A>(item: Guard<unknown, A>): Guard<unknown, Set<A>> => ({
	is: (u: unknown): u is Set<A> => {
		if (typeof Set === undefined || !(u instanceof Set)) {
			return false;
		}
		for (const value of u.values()) {
			if (!item.is(value)) {
				return false;
			}
		}
		return true;
	}
});

export const nonEmptyArray = <A>(item: Guard<unknown, A>): Guard<unknown, NonEmptyArray<A>> => {
	const arr = array(item);
	return {
		is: (u: unknown): u is NonEmptyArray<A> => arr.is(u) && isNonEmpty(u)
	};
};
