import { getStructEq } from 'fp-ts/lib/Eq'
import * as eq from 'fp-ts/lib/Eq'
import { constNull, Lazy } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { pipe } from 'fp-ts/lib/pipeable'
import * as a from 'fp-ts/lib/array'
import { Tree } from 'fp-ts/lib/Tree'
import * as c from 'io-ts/lib/Codec'
import * as e from 'io-ts/lib/Encoder'
import * as g from 'io-ts/lib/Guard'
import * as o from 'fp-ts/lib/Option'
import * as either from 'fp-ts/lib/Either'
import * as m from 'fp-ts/lib/Map'
import * as d from 'io-ts/lib/Decoder'

export interface Model<T> extends c.Codec<T>, g.Guard<T>, eq.Eq<T> {}

export type TypeOf<M> = M extends Model<infer T> ? T : never

export const string: Model<string> = {
	equals: eq.eqString.equals,
	is: g.string.is,
	...c.string
}

export const number: Model<number> = {
	equals: eq.eqNumber.equals,
	is: g.number.is,
	...c.number
}

export const boolean: Model<boolean> = {
	equals: eq.eqBoolean.equals,
	is: g.boolean.is,
	...c.boolean
}

export function type<T>(properties: { [K in keyof T]: Model<T[K]> }): Model<T> {
	return {
		equals: getStructEq(properties).equals,
		is: g.type(properties).is,
		...c.type(properties)
	}
}

export const ARRAY_TAG = 'Array' as const

export function array<T>(val: Model<T>): Model<T[]> {
	return {
		_tag: ARRAY_TAG,
		equals: a.getEq(val).equals,
		...c.array(val),
		...g.array(val)
	}
}

export function isArrayModel(u: Model<any>): u is Model<unknown[]> {
	return u._tag === ARRAY_TAG
}

const UnknownRecordGuard: g.Guard<Record<string | number, unknown>> = {
	is: (u: unknown): u is Record<string | number, unknown> => Object.prototype.toString.call(u) === '[object Object]'
}

const UnknownRecordDecoder: d.Decoder<Record<string | number, unknown>> = d.fromGuard(
	UnknownRecordGuard,
	'stringNode | number'
)

const MAP_TAG = 'Map' as const

export function map<Key extends string | number, Value>(key: Model<Key>, value: Model<Value>): Model<Map<Key, Value>> {
	return {
		_tag: MAP_TAG,
		equals: m.getEq(key, value).equals,
		encode: getMapEncoder(key, value).encode,
		decode: getMapDecoder(key, value).decode,
		is: getMapGuard(key, value).is
	}
}

export function isMapModel(u: Model<any>): u is Model<Map<unknown, unknown>> {
	return u._tag === MAP_TAG
}

function getMapDecoder<Key extends string | number, Value>(
	key: d.Decoder<Key>,
	value: d.Decoder<Value>
): d.Decoder<Map<Key, Value>> {
	return {
		decode: (u) => {
			const v = UnknownRecordDecoder.decode(u)
			if (either.isLeft(v)) {
				return v
			} else {
				const r = v.right
				const m: Map<Key, Value> = new Map()
				const errors: Array<Tree<string>> = []
				for (const [k, v] of Object.entries(r)) {
					const decodedKey = key.decode(k)
					const decodedValue = value.decode(v)

					if (either.isLeft(decodedKey)) {
						errors.push(d.tree(`invalid key supplied ${JSON.stringify(k)}`, decodedKey.left))
					}
					if (either.isLeft(decodedValue)) {
						errors.push(d.tree(`invalid value supplied ${JSON.stringify(v)}`, decodedValue.left))
					}
					if (either.isRight(decodedKey) && either.isRight(decodedValue)) {
						m.set(decodedKey.right, decodedValue.right)
					}
				}
				return isNotEmpty(errors) ? either.left(errors) : d.success(m)
			}
		}
	}
}

function getMapEncoder<Key extends string | number, Value>(
	key: e.Encoder<Key>,
	value: e.Encoder<Value>
): e.Encoder<Map<Key, Value>> {
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

function getMapGuard<Key, Value>(key: g.Guard<Key>, value: g.Guard<Value>): g.Guard<Map<Key, Value>> {
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

export function getOption<T>(val: Model<T>, lazy: Lazy<T | null> = constNull): Model<o.Option<T>> {
	return {
		equals: o.getEq(val).equals,
		decode: (u) => (u === null ? either.right(o.none as o.Option<T>) : pipe(u, val.decode, either.map(o.some))),
		encode: o.fold(lazy, val.encode),
		is: getOptionGuard(val).is
	}
}

const noneGuard = g.type({ _tag: g.literal('None') })

const _tagGuardSum = g.sum('_tag')

function getOptionGuard<T>(guard: g.Guard<T>): g.Guard<o.Option<T>> {
	return _tagGuardSum({
		None: noneGuard,
		Some: g.type({ _tag: g.literal('Some'), value: guard })
	})
}

export const optionString = getOption(string)

export const optionNumber = getOption(number)

export const optionBoolean = getOption(boolean)
