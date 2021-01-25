import * as assert from 'assert'
import { constant, constVoid, flow, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold } from 'fp-ts/IOEither'
import { fold as foldO, some } from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { computed, shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const Array = N.schema('Array', { a: N.array(N.staticString) })

function useCache(useImmutableArrays = false) {
	const cache = make({ useImmutableArrays })(Array)(Array)
	const write = (data: N.TypeOf<typeof Array>) =>
		pipe(
			TE.fromEither(cache),
			TE.chain((c) => TE.fromTask(c.write({})(data))),
			TE.getOrElse(() => async () => constVoid)
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
	it('has reactive reads', async () => {
		const { write, values } = useCache()

		assert.deepStrictEqual(values.value, [])

		await write({ a: data })

		assert.deepStrictEqual(values.value, data)
	}),
		it('has reactive entries', async () => {
			const { write, refs } = useCache()

			assert.deepStrictEqual(refs.value, [])

			await write({ a: data })

			assert.deepStrictEqual(refs.value, data.map(flow(some, shallowRef)))
		}),
		it('evicts new entries', async () => {
			const { values, write } = useCache()

			const evict = await write({ a: data })

			evict()

			assert.deepStrictEqual(values.value, [])
		}),
		it('evicts overwritten entries by returning the previous value', async () => {
			const { values, write } = useCache()

			await write({ a: data })

			const evict = await write({ a: update })

			evict()

			assert.deepStrictEqual(values.value, data)
		}),
		it('applies partial updates with mutable arrays', async () => {
			const { values, write } = useCache()

			await write({ a: update })

			await write({ a: data })

			assert.deepStrictEqual(values.value, ['1', '3'])
		}),
		it('does not apply partial update with immutable arrays', async () => {
			const { values, write } = useCache(true)

			await write({ a: update })

			await write({ a: data })

			assert.deepStrictEqual(values.value, data)
		}),
		it('deletes null entries', async () => {
			const { write, values } = useCache()

			await write({ a: update })

			const evict = await write({ a: [null as any] })

			assert.deepStrictEqual(values.value, ['3'])

			evict()

			assert.deepStrictEqual(values.value, update)
		})
})
