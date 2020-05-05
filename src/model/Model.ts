import { getStructEq } from 'fp-ts/lib/Eq'
import * as EQ from 'fp-ts/lib/Eq'
import { constNull, flow, Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { pipe } from 'fp-ts/lib/pipeable'
import * as A from 'fp-ts/lib/array'
import { Tree } from 'fp-ts/lib/Tree'
import * as C from 'io-ts/lib/Codec'
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

type Overrides<T> = Partial<Model<T>>

const DEFAULT_OVERRIDES: Overrides<any> = {}

export function type<T>(
	members: { [K in keyof T]: Model<T[K]> },
	overrides: Overrides<T> = DEFAULT_OVERRIDES
): Model<T> {
	return {
		equals: getStructEq(members).equals,
		is: G.type(members).is,
		...C.type(members),
		...overrides
	}
}

export function typeWithUniqueIdentifier<T, K extends keyof T>(
	properties: { [K in keyof T]: Model<T[K]> },
	key: K,
	overrides: Overrides<T> = DEFAULT_OVERRIDES
): Model<T> {
	const keyModel = properties[key]
	return {
		...type(properties),
		equals: (x, y) => keyModel.equals(x[key], y[key]),
		...overrides
	}
}

export function nonEmptyArray<T>(
	val: Model<T>,
	overrides: Overrides<NE.NonEmptyArray<T>> = DEFAULT_OVERRIDES
): Model<NE.NonEmptyArray<T>> {
	const a = array(val)
	return {
		encode: a.encode,
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
		},
		...overrides
	}
}

export const ARRAY_TAG = 'Array' as const

export function array<T>(val: Model<T>, overrides: Overrides<T[]> = DEFAULT_OVERRIDES): Model<T[]> {
	return {
		equals: A.getEq(val).equals,
		...C.array(val),
		...G.array(val),
		...overrides
	}
}

const UnknownRecordGuard: G.Guard<Record<string | number, unknown>> = {
	is: (u: unknown): u is Record<string | number, unknown> => Object.prototype.toString.call(u) === '[object Object]'
}

const UnknownRecordDecoder: D.Decoder<Record<string | number, unknown>> = D.fromGuard(
	UnknownRecordGuard,
	'stringNode | number'
)

export function map<Key extends string | number, Value>(
	key: Model<Key>,
	value: Model<Value>,
	overrides: Overrides<Map<Key, Value>> = DEFAULT_OVERRIDES
): Model<Map<Key, Value>> {
	return {
		equals: M.getEq(key, value).equals,
		encode: getMapEncoder(key, value).encode,
		decode: getMapDecoder(key, value).decode,
		is: getMapGuard(key, value).is,
		...overrides
	}
}

export function set<T>(model: Model<T>, overrides: Overrides<Set<T>> = DEFAULT_OVERRIDES): Model<Set<T>> {
	const a = array(model)
	return {
		equals: S.getEq(model).equals,
		encode: flow(toArray, a.encode),
		decode: flow(a.decode, EITHER.map(fromArray)),
		is: (u: unknown): u is Set<T> => {
			if (typeof Set !== undefined && u instanceof Set) {
				return a.is(toArray(u))
			} else {
				return false
			}
		},
		...overrides
	}
}

function toArray<T>(set: Set<T>): T[] {
	const x: T[] = []
	set.forEach((e) => x.push(e))
	return x
}

function fromArray<T>(a: T[]): Set<T> {
	return new Set(a)
}

function getMapDecoder<Key extends string | number, Value>(
	key: D.Decoder<Key>,
	value: D.Decoder<Value>
): D.Decoder<Map<Key, Value>> {
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

function getMapEncoder<Key extends string | number, Value>(
	key: E.Encoder<Key>,
	value: E.Encoder<Value>
): E.Encoder<Map<Key, Value>> {
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

function isNotEmpty<A>(as: Array<A>): as is NonEmptyArray<A> {
	return as.length > 0
}

export function option<T>(
	val: Model<T>,
	lazy: Lazy<T | null> = constNull,
	overrides: Overrides<O.Option<T>> = DEFAULT_OVERRIDES
): Model<O.Option<T>> {
	return {
		equals: O.getEq(val).equals,
		decode: (u) => (u === null ? EITHER.right(O.none as O.Option<T>) : pipe(u, val.decode, EITHER.map(O.some))),
		encode: O.fold(lazy, val.encode),
		is: getOptionGuard(val).is,
		...overrides
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
		const equals = (a: any, b: any): boolean => {
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
