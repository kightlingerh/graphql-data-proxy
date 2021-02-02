import * as assert from 'assert'
import { right } from 'fp-ts/Either'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold } from 'fp-ts/IOEither'
import { none } from 'fp-ts/lib/Option'
import { some } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'
import { shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const schema = N.schema('Primitive', { a: N.staticString })
const cache = make({})(schema)(schema)
const write = (data: N.TypeOf<typeof schema>) =>
	pipe(
		IOE.fromEither(cache),
		IOE.chain((c) => IOE.fromIO(c.write({})(data))),
		IOE.getOrElse(() => () => constVoid)
	)()

describe('primitive', () => {
	it('is reactive', () => {
		const ref = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.toEntries({}))),
			fold(
				() => constant(shallowRef(none)),
				(entries) => () => entries.a
			)
		)()

		assert.deepStrictEqual(ref.value, none)

		const writeValue = { a: '1' }

		write(writeValue)

		assert.deepStrictEqual(some(writeValue.a), ref.value)
	}),
		it('can evict', () => {
			const ref = pipe(
				fromEither(cache),
				chain((c) => rightIO(c.toEntries({}))),
				fold(
					() => constant(shallowRef(none)),
					(entries) => () => entries.a
				)
			)()

			const writeValue = { a: '1' }

			write(writeValue)

			assert.deepStrictEqual(some(writeValue.a), ref.value)

			const evict = write({ a: '2' })

			evict()

			assert.deepStrictEqual(some(writeValue.a), ref.value)
		}),
		it('can read', () => {
			const read = pipe(
				fromEither(cache),
				chain((c) => rightIO(c.read({})))
			)

			const writeValue = { a: '1' }

			write(writeValue)

			assert.deepStrictEqual(read(), right(some(writeValue)))
		})
})
