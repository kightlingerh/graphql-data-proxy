import * as A from 'fp-ts/lib/Array'
import * as EQ from 'fp-ts/lib/Eq'
import { constant, constNull, flow, Lazy } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/lib/pipeable'
import { Tree } from 'fp-ts/lib/Tree'
import * as C from 'io-ts/lib/Codec'
import { DecodeError } from 'io-ts/lib/Decoder'
import { lazy as eqLazy } from 'io-ts/lib/Eq';
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
		equals: (x, y) => {
			for (const k in members) {
				const xk = x[k]
				const yk = y[k]
				if (!(xk === undefined || yk === undefined ? xk === yk : members[k].equals(xk!, yk!))) {
					return false
				}
			}
			return true
		},
		is: G.partial(members).is,
		...C.partial(members)
	}
}

export function intersection<A, B>(left: Model<A>, right: Model<B>): Model<A & B> {
	return {
		equals: (x, y) => left.equals(x, y) && right.equals(x, y),
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
		...D.union(...members)
	}
}

export function typeWithUniqueIdentifier<T, K extends keyof T>(
	properties: { [K in keyof T]: Model<T[K]> },
	key: K
): Model<T> {
	const keyModel = properties[key]
	return {
		...type(properties),
		equals: (x, y) => keyModel.equals(x[key], y[key])
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
				return isNotEmpty(r)
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

const UnknownRecordGuard: G.Guard<Record<string | number, unknown>> = {
	is: (u: unknown): u is Record<string | number, unknown> => Object.prototype.toString.call(u) === '[object Object]'
}

const UnknownRecordDecoder: D.Decoder<Record<string | number, unknown>> = D.fromGuard(
	UnknownRecordGuard,
	'stringNode | number'
)

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

function getMapDecoder<Key, Value>(key: D.Decoder<Key>, value: D.Decoder<Value>): D.Decoder<Map<Key, Value>> {
	return {
		decode: (u) => {
			const v = UnknownRecordDecoder.decode(u)
			if (EITHER.isLeft(v)) {
				return v
			} else {
				const r = v.right
				const m: Map<Key, Value> = new Map()
				const errors: Array<Tree<string>> = []
				for (const [k, v] of Object.entries(r)) {
					const decodedKey = key.decode(k)
					const decodedValue = value.decode(v)

					if (EITHER.isLeft(decodedKey)) {
						errors.push(D.tree(`invalid key supplied ${JSON.stringify(k)}`, decodedKey.left))
					}
					if (EITHER.isLeft(decodedValue)) {
						errors.push(D.tree(`invalid value supplied ${JSON.stringify(v)}`, decodedValue.left))
					}
					if (EITHER.isRight(decodedKey) && EITHER.isRight(decodedValue)) {
						m.set(decodedKey.right, decodedValue.right)
					}
				}
				return isNotEmpty(errors) ? EITHER.left(errors) : D.success(m)
			}
		}
	}
}

function getMapGuard<Key, Value>(key: G.Guard<Key>, value: G.Guard<Value>): G.Guard<Map<Key, Value>> {
	return {
		is: (u: unknown): u is Map<Key, Value> => {
			if (typeof Map !== undefined && u instanceof Map) {
				for (const [k, v] of u.entries()) {
					if (!key.is(k) || !value.is(v)) {
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

function isNotEmpty<A>(as: Array<A>): as is NE.NonEmptyArray<A> {
	return as.length > 0
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
		const equals = (a: unknown, b: unknown): boolean => {
			for (const key in members) {
				const m = members[key]
				if (m.is(a) && m.is(b)) {
					return m.equals(a, b)
				}
			}
			return false
		}

		return {
			equals,
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
		equals: EQ.getTupleEq(...models).equals,
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
