import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold } from 'fp-ts/IOEither'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { none, map, some } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'
import { computed } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const NonEmptyArray = N.schema('NonEmptyArray', { a: N.nonEmptyArray(N.staticString) })

function useCache(useImmutableArrays = false) {
	const cache = make({ useImmutableArrays })(NonEmptyArray)(NonEmptyArray)
	const write = (data: N.TypeOf<typeof NonEmptyArray>) =>
		pipe(
			IOE.fromEither(cache),
			IOE.chain((c) => IOE.fromIO(c.write({})(data))),
			IOE.getOrElse(() => () => constVoid)
		)()

	const values = computed(
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read({}))),
			fold(
				() => constant(none),
				(s) => () =>
					pipe(
						s,
						map((r) => r.a)
					)
			)
		)
	)

	return {
		cache,
		write,
		values
	}
}

const data: NonEmptyArray<string> = ['1']

const update: NonEmptyArray<string> = ['2', '3']

describe('nonEmptyArray', () => {
	it('is reactive', () => {
		const { write, values } = useCache()

		assert.deepStrictEqual(values.value, none)

		write({ a: data })

		assert.deepStrictEqual(values.value, some(data))
	}),
		it('evicts new entries', () => {
			const { values, write } = useCache()

			const evict = write({ a: data })

			evict()

			assert.deepStrictEqual(values.value, none)
		}),
		it('evicts overwritten entries by returning the previous value', () => {
			const { values, write } = useCache()

			write({ a: data })

			const evict = write({ a: update })

			evict()

			assert.deepStrictEqual(values.value, some(data))
		})
})
