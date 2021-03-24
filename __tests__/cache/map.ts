import * as assert from 'assert'
import { right } from 'fp-ts/Either'
import { constant, constVoid, flow, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold } from 'fp-ts/IOEither'
import { some } from 'fp-ts/lib/Option'
import { fromNullable, Option, chain as chainOption, none } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'
import { computed } from 'vue'
import { Ref } from '../../src/node'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const schema = N.schema('Map', { a: N.map(N.staticString, N.staticInt) })

function useCache() {
	const cache = make({})(schema).select(schema)
	const write = (data: N.TypeOf<typeof schema>) =>
		pipe(
			IOE.fromEither(cache),
			IOE.chain((c) => IOE.fromIO(c.write({})(data))),
			IOE.getOrElse(() => () => constVoid)
		)()

	const toMap = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.toEntries({}))),
		fold(
			() => constant(new Map<string, Ref<Option<number>>>()),
			(entries) => () => entries.a
		)
	)

	const to1 = flow(
		toMap,
		(m) => fromNullable(m.get('1')),
		chainOption((ref) => ref.value)
	)

	const to2 = flow(
		toMap,
		(m) => fromNullable(m.get('2')),
		chainOption((ref) => ref.value)
	)

	const ref1 = computed(to1)

	const ref2 = computed(to2)

	const read = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.read({})))
	)

	return {
		cache,
		write,
		ref1,
		ref2,
		read
	}
}

const originalMap = new Map([['1', 1]])

const overwriteOriginalMap = new Map([['1', 2]])

const newMap = new Map([['2', 2]])

const combinedMap = new Map([...originalMap.entries(), ...newMap.entries()])

describe('map', () => {
	it('is reactive', () => {
		const { write, ref1, ref2 } = useCache()

		assert.deepStrictEqual(ref1.value, none)

		write({ a: originalMap })

		assert.deepStrictEqual(ref1.value, some(1))

		write({ a: newMap })

		assert.deepStrictEqual(ref2.value, some(2))
	}),
		it('evicts new entries by deleting the key', () => {
			const { ref1, write } = useCache()

			const evict = write({ a: originalMap })

			evict()

			assert.deepStrictEqual(ref1.value, none)
		}),
		it('evicts overwritten entries by returning the previous value', () => {
			const { ref1, write } = useCache()

			write({ a: originalMap })

			const evict = write({ a: overwriteOriginalMap })

			evict()

			assert.deepStrictEqual(ref1.value, some(1))
		}),
		it('can read', () => {
			const { write, read } = useCache()

			write({ a: originalMap })

			assert.deepStrictEqual(read(), right(some({ a: originalMap })))

			write({ a: newMap })

			assert.deepStrictEqual(read(), right(some({ a: combinedMap })))
		}),
		it('deletes null entries', () => {
			const { write, ref1 } = useCache()

			write({ a: originalMap })

			const evict = write({ a: new Map([['1', null as any]]) })

			assert.deepStrictEqual(ref1.value, none)

			evict()

			assert.deepStrictEqual(ref1.value, some(1))
		})
})
