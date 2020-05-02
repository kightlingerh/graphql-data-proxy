import { getStructEq } from 'fp-ts/lib/Eq'
import * as eq from 'fp-ts/lib/Eq'
import { constNull, Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { pipe } from 'fp-ts/lib/pipeable'
import * as a from 'fp-ts/lib/array'
import { Tree } from 'fp-ts/lib/Tree'
import * as C from 'io-ts/lib/Codec'
import * as E from 'io-ts/lib/Encoder'
import * as G from 'io-ts/lib/Guard'
import * as O from 'fp-ts/lib/Option'
import * as EITHER from 'fp-ts/lib/Either'
import * as M from 'fp-ts/lib/Map'
import * as D from 'io-ts/lib/Decoder'

export interface Model<T> extends C.Codec<T>, G.Guard<T>, E.Encoder<T>, eq.Eq<T> {}

export type TypeOf<M> = M extends Model<infer T> ? T : never

export const string: Model<string> = {
	equals: eq.eqString.equals,
	is: G.string.is,
	...C.string
}

export const number: Model<number> = {
	equals: eq.eqNumber.equals,
	is: G.number.is,
	...C.number
}

export const boolean: Model<boolean> = {
	equals: eq.eqBoolean.equals,
	is: G.boolean.is,
	...C.boolean
}

export function type<T>(properties: { [K in keyof T]: Model<T[K]> }): Model<T> {
	return {
		equals: getStructEq(properties).equals,
		is: G.type(properties).is,
		...C.type(properties)
	}
}

export const ARRAY_TAG = 'Array' as const

export function array<T>(val: Model<T>): Model<T[]> {
	return {
		equals: a.getEq(val).equals,
		...C.array(val),
		...G.array(val)
	}
}

const UnknownRecordGuard: G.Guard<Record<string | number, unknown>> = {
	is: (u: unknown): u is Record<string | number, unknown> => Object.prototype.toString.call(u) === '[object Object]'
}

const UnknownRecordDecoder: D.Decoder<Record<string | number, unknown>> = D.fromGuard(
	UnknownRecordGuard,
	'stringNode | number'
)

export function map<Key extends string | number, Value>(key: Model<Key>, value: Model<Value>): Model<Map<Key, Value>> {
	return {
		equals: M.getEq(key, value).equals,
		encode: getMapEncoder(key, value).encode,
		decode: getMapDecoder(key, value).decode,
		is: getMapGuard(key, value).is
	}
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
