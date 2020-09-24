import { isNonEmpty } from 'fp-ts/lib/Array'
import * as A from 'fp-ts/lib/Array'
import * as EQ from 'fp-ts/lib/Eq'
import { constant, constNull, flow, Lazy } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/lib/pipeable'
import { Tree } from 'fp-ts/lib/Tree'
import * as C from 'io-ts/lib/Codec'
import { DecodeError } from 'io-ts/lib/Decoder'
import {
	lazy as eqLazy,
	partial as eqPartial,
	sum as eqSum,
	tuple as eqTuple,
	intersection as eqIntersection
} from 'io-ts/lib/Eq'
import * as E from 'io-ts/lib/Encoder'
import * as G from 'io-ts/lib/Guard'
import * as O from 'fp-ts/lib/Option'
import * as EITHER from 'fp-ts/lib/Either'
import * as M from 'fp-ts/lib/Map'
import * as D from 'io-ts/lib/Decoder'
import * as NE from 'fp-ts/lib/NonEmptyArray'
import * as S from 'fp-ts/lib/Set'
import { Literal } from 'io-ts/lib/Schemable'

export interface Model<T> extends C.Codec<T>, G.Guard<T>, EQ.Eq<T> {}

export type TypeOf<M> = M extends Model<infer T> ? T : never

export const string: Model<string> = {
	equals: EQ.eqString.equals,
	is: G.string.is,
	...C.string
}

export const number: Model<number> = {
	equals: EQ.eqNumber.equals,
	is: G.number.is,
	...C.number
}

function decodeInt(u: unknown) {
	if (G.string.is(u)) {
		try {
			const int = parseInt(u, 10)
			return isNaN(int)
				? D.failure(`cannot decode ${JSON.stringify(u)}, should be string | number`)
				: D.success(int)
		} catch {
			return D.failure(`cannot decode ${JSON.stringify(u)}, should be string | number`)
		}
	}
	return pipe(D.number.decode(u), EITHER.map(Math.trunc))
}

export const int: Model<number> = {
	...number,
	decode: decodeInt
}

function decodeFloat(u: unknown) {
	if (G.string.is(u)) {
		try {
			const int = parseFloat(u)
			return isNaN(int)
				? D.failure(`cannot decode ${JSON.stringify(u)}, should be string | number`)
				: D.success(int)
		} catch {
			return D.failure(`cannot decode ${JSON.stringify(u)}, should be string | number`)
		}
	}
	return D.number.decode(u)
}

export const float: Model<number> = {
	...number,
	decode: decodeFloat
}

export const boolean: Model<boolean> = {
	equals: EQ.eqBoolean.equals,
	is: G.boolean.is,
	...C.boolean
}

export function type<T>(members: { [K in keyof T]: Model<T[K]> }): Model<T> {
	return {
		equals: EQ.getStructEq(members).equals,
		is: G.type(members).is,
		...C.type(members)
	}
}

export function partial<T>(members: { [K in keyof T]: Model<T[K]> }): Model<Partial<T>> {
	return {
		equals: eqPartial(members).equals,
		is: G.partial(members).is,
		...C.partial(members)
	}
}

export function intersection<A, B>(left: Model<A>, right: Model<B>): Model<A & B> {
	return {
		equals: eqIntersection(left, right).equals,
		is: G.intersection(left, right).is,
		...C.intersection(left, right)
	}
}

export function union<A extends ReadonlyArray<unknown>>(...members: { [K in keyof A]: Model<A[K]> }): Model<A[number]> {
	return {
		equals: (x, y) => {
			return members.filter((m) => m.is(x) && m.is(y)).some((m) => m.equals(x, y))
		},
		is: G.union(...members).is,
		encode: (a) => {
			return pipe(
				members.filter((m) => m.is(a)),
				A.head,
				O.fold(constant(JSON.stringify(a)), (m) => m.encode(a))
			)
		},
		decode: D.union(...members).decode
	}
}

export function nonEmptyArray<T>(val: Model<T>): Model<NE.NonEmptyArray<T>> {
	const a = array(val)
	return {
		encode: (nea) => a.encode(nea as T[]),
		equals: NE.getEq(val).equals,
		is: (u: unknown): u is NE.NonEmptyArray<T> => a.is(u) && u.length > 0,
		decode: (u) => {
			const arr = a.decode(u)
			if (EITHER.isLeft(arr)) {
				return arr
			} else {
				const r = arr.right
				return isNonEmpty(r)
					? D.success(r)
					: D.failure(`expected non empty array but received ${JSON.stringify(u)}`)
			}
		}
	}
}

export function array<T>(val: Model<T>): Model<T[]> {
	return {
		equals: A.getEq(val).equals,
		is: G.array(val).is,
		...C.array(val)
	}
}

export function map<Key, Value>(key: Model<Key>, value: Model<Value>): Model<Map<Key, Value>> {
	return {
		equals: M.getEq(key, value).equals,
		encode: getMapEncoder(key, value).encode,
		decode: getMapDecoder(key, value).decode,
		is: getMapGuard(key, value).is
	}
}

function getMapEncoder<Key, Value>(key: E.Encoder<Key>, value: E.Encoder<Value>): E.Encoder<Map<Key, Value>> {
	return {
		encode: (a) => {
			const encodedObject: any = {}
			for (const [k, v] of a.entries()) {
				encodedObject[key.encode(k) as string | number] = value.encode(v)
			}
			return encodedObject
		}
	}
}

export function isObject(obj: any): obj is object {
	return obj !== null && typeof obj === 'object'
}

function getMapDecoder<Key, Value>(key: D.Decoder<Key>, value: D.Decoder<Value>): D.Decoder<Map<Key, Value>> {
	return {
		decode: (u) => {
			if (!isObject(u)) {
				return EITHER.left([D.tree(`invalid value supplied as map: ${JSON.stringify(u)}, should be an object`)])
			} else {
				const m: Map<Key, Value> = new Map()
				const errors: Array<Tree<string>> = []
				for (const [k, v] of Object.entries(u)) {
					const decodedKey = key.decode(k)
					const decodedValue = value.decode(v)

					if (EITHER.isLeft(decodedKey)) {
						errors.push(D.tree(`invalid key supplied ${JSON.stringify(k)}`, decodedKey.left))
						console.log(`invalid key supplied ${JSON.stringify(k)}`)
					}

					if (EITHER.isLeft(decodedValue)) {
						errors.push(D.tree(`invalid value supplied ${JSON.stringify(v)}`, decodedValue.left))
					}
					if (EITHER.isRight(decodedKey) && EITHER.isRight(decodedValue)) {
						m.set(decodedKey.right, decodedValue.right)
					}
				}
				return isNonEmpty(errors) ? EITHER.left(errors) : EITHER.right(m)
			}
		}
	}
}

function getMapGuard<Key, Value>(key: G.Guard<Key>, value: G.Guard<Value>): G.Guard<Map<Key, Value>> {
	const nullableValue = G.nullable(value)
	return {
		is: (u: unknown): u is Map<Key, Value> => {
			if (typeof Map !== undefined && u instanceof Map) {
				for (const [k, v] of u.entries()) {
					if (!key.is(k) || !nullableValue.is(v)) {
						return false
					}
				}
				return true
			} else {
				return false
			}
		}
	}
}

export function set<T>(model: Model<T>): Model<Set<T>> {
	const a = array(model)
	return {
		equals: S.getEq(model).equals,
		encode: flow(setToArray, a.encode),
		decode: flow(a.decode, EITHER.map(arrayToSet)),
		is: (u: unknown): u is Set<T> => {
			if (typeof Set !== undefined && u instanceof Set) {
				for (const v of u.values()) {
					if (!model.is(v)) {
						return false
					}
				}
				return true
			} else {
				return false
			}
		}
	}
}

function setToArray<T>(set: Set<T>): T[] {
	const x: T[] = []
	set.forEach((e) => x.push(e))
	return x
}

function arrayToSet<T>(a: T[]): Set<T> {
	return new Set(a)
}

export function option<T>(val: Model<T>, lazy: Lazy<T | null> = constNull): Model<O.Option<T>> {
	return {
		equals: O.getEq(val).equals,
		decode: (u) => (u === null ? EITHER.right(O.none as O.Option<T>) : pipe(u, val.decode, EITHER.map(O.some))),
		encode: O.fold(lazy, val.encode),
		is: getOptionGuard(val).is
	}
}

const noneGuard = G.type({ _tag: G.literal('None') })

const _tagGuardSum = G.sum('_tag')

function getOptionGuard<T>(guard: G.Guard<T>): G.Guard<O.Option<T>> {
	return _tagGuardSum({
		None: noneGuard,
		Some: G.type({ _tag: G.literal('Some'), value: guard })
	})
}

export const optionString = option(string)

export const optionNumber = option(number)

export const optionBoolean = option(boolean)

export function sum<T extends string>(
	tag: T
): <A>(members: { [K in keyof A]: Model<A[K] & Record<T, K>> }) => Model<A[keyof A]> {
	return (members) => {
		return {
			equals: eqSum(tag)(members).equals,
			encode: E.sum(tag)(members).encode,
			is: G.sum(tag)(members).is,
			decode: D.sum(tag)(members).decode
		}
	}
}

export function literal<A extends ReadonlyArray<Literal>>(...values: A): Model<A[number]> {
	return {
		equals: EQ.eqStrict.equals,
		is: G.literal(...values).is,
		decode: D.literal(...values).decode,
		encode: E.id.encode
	}
}

function getEitherGuard<E, A>(left: G.Guard<E>, right: G.Guard<A>): G.Guard<EITHER.Either<E, A>> {
	return _tagGuardSum({
		Left: G.type({ _tag: G.literal('Left'), left }),
		Right: G.type({ _tag: G.literal('Right'), right })
	})
}

export function either<E, A>(left: Model<E>, right: Model<A>): Model<EITHER.Either<E, A>> {
	return {
		equals: EITHER.getEq(left, right).equals,
		is: getEitherGuard(left, right).is,
		decode: (u) => {
			const r = right.decode(u)
			if (EITHER.isRight(r)) {
				return EITHER.right(r)
			}
			const l = left.decode(u)
			if (EITHER.isRight(l)) {
				return EITHER.right(EITHER.left(l.right))
			}
			return EITHER.left([...l.left, ...r.left] as DecodeError)
		},
		encode: (a) => (EITHER.isRight(a) ? right.encode(a.right) : left.encode(a.left))
	}
}

export function tuple<A extends ReadonlyArray<unknown>>(...models: { [K in keyof A]: Model<A[K]> }): Model<A> {
	return {
		equals: eqTuple(...models).equals,
		is: G.tuple(...models).is,
		decode: D.tuple(...models).decode,
		encode: E.tuple(...models).encode
	} as any
}

export function lazy<A>(id: string, model: Lazy<Model<A>>): Model<A> {
	return {
		equals: eqLazy(model).equals,
		is: G.lazy(model).is,
		decode: D.lazy(id, model).decode,
		encode: E.lazy(model).encode
	}
}

export function useEncoder<T>(model: Model<T>, encoder: E.Encoder<T>): Model<T> {
	return {
		...model,
		...encoder
	}
}

export function encodeById<T extends Record<'id', Literal>>(model: Model<T>): Model<T> {
	return {
		...model,
		encode: (x) => E.id.encode(x.id)
	}
}

export function useEq<T>(model: Model<T>, eq: EQ.Eq<T>): Model<T> {
	return {
		...model,
		...eq
	}
}

export function eqById<T extends Record<'id', Literal>>(model: Model<T>): Model<T> {
	return {
		...model,
		equals: (x, y) => x.id === y.id
	}
}
