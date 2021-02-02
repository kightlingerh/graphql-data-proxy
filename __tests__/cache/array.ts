import * as assert from 'assert'
import { constant, constVoid, flow, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold } from 'fp-ts/IOEither'
import { fold as foldO, some } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'
import { computed, shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const Array = N.schema('Array', { a: N.array(N.staticString) })

function useCache(useImmutableArrays = false) {
	const cache = make({ useImmutableArrays })(Array)(Array)
	const write = (data: N.TypeOf<typeof Array>) =>
		pipe(
			IOE.fromEither(cache),
			IOE.chain((c) => IOE.fromIO(c.write({})(data))),
			IOE.getOrElse(() => () => constVoid)
		)()

	const refs = computed(
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.toEntries({}))),
			fold(
				() => constant([]),
				(s) => () => s.a
			)
		)
	)

	const values = computed(
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read({}))),
			fold(
				() => constant([]),
				(s) => () =>
					pipe(
						s,
						foldO(constant([]), (r) => r.a)
					)
			)
		)
	)

	return {
		refs,
		cache,
		write,
		values
	}
}

const data = ['1']

const update = ['2', '3']

describe('array', () => {
	it('has reactive reads', () => {
		const { write, values } = useCache()

		assert.deepStrictEqual(values.value, [])

		write({ a: data })

		assert.deepStrictEqual(values.value, data)
	}),
		it('has reactive entries', () => {
			const { write, refs } = useCache()

			assert.deepStrictEqual(refs.value, [])

			write({ a: data })

			assert.deepStrictEqual(refs.value, data.map(flow(some, shallowRef)))
		}),
		it('evicts new entries', () => {
			const { values, write } = useCache()

			const evict = write({ a: data })

			evict()

			assert.deepStrictEqual(values.value, [])
		}),
		it('evicts overwritten entries by returning the previous value', () => {
			const { values, write } = useCache()

			write({ a: data })

			const evict = write({ a: update })

			evict()

			assert.deepStrictEqual(values.value, data)
		})
})
