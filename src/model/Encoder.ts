import {Either, fold as foldE } from 'fp-ts/Either';
import {constNull} from 'fp-ts/lib/function';
import {fold, Option} from 'fp-ts/lib/Option';
import * as E from 'io-ts/Encoder'
import {Float, Int} from './Guard';
export * from 'io-ts/Encoder';

export const string = E.id<string>();

export const boolean = E.id<boolean>();

export const number = E.id<number>();

export const int = E.id<Int>();

export const float = E.id<Float>();

export const option = <O, A>(item: E.Encoder<O, A>): E.Encoder<O | null, Option<A>> => ({
	encode: fold(constNull, item.encode)
});

export const either = <OL, OR, L, R>(l: E.Encoder<OL, L>, r: E.Encoder<OR, R>): E.Encoder<OL | OR, Either<L, R>> => ({
	encode: foldE<L, R, OL | OR>((l as E.Encoder<OL | OR, L>).encode, (r as E.Encoder<OL | OR, R>).encode)
});

export const map = <OM, OK, OA, K, A>(fromPairs: (pairs: Array<[OK, OA]>) => OM) => (k: E.Encoder<OK, K>, a: E.Encoder<OA, A>): E.Encoder<OM, Map<K, A>> => ({
	encode: i => {
		const pairs: Array<[OK, OA]> = [];
		for (const [key, value] of i.entries()) {
			pairs.push([k.encode(key), a.encode(value)])
		}
		return fromPairs(pairs);
	}
})

export const set = <O, A>(a: E.Encoder<O, A>): E.Encoder<O[], Set<A>> => ({
	encode: i => {
		const values: O[] = [];
		i.forEach(value => {
			values.push(a.encode(value))
		});
		return values;
	}
})



