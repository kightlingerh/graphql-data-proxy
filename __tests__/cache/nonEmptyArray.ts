import * as assert from 'assert'
import {constant, constVoid, pipe} from 'fp-ts/function';
import {chain, fromEither, rightIO, fold} from 'fp-ts/IOEither';
import {NonEmptyArray} from 'fp-ts/lib/NonEmptyArray';
import {none, map, some} from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {computed} from 'vue';
import * as N from '../../src/node';
import { make } from '../../src/cache/Cache'

const Array = N.schema('NonEmptyArray', { a: N.nonEmptyArray(N.staticString) })

function useCache(useImmutableArrays = false) {
	const cache = make({ useImmutableArrays })(Array)(Array);
	const write = (data: N.TypeOf<typeof Array>) => pipe(
		TE.fromEither(cache),
		TE.chain((c) => TE.fromTask(c.write({})(data))),
		TE.getOrElse(() => async () => constVoid)
	)()


	const values = computed(pipe(
		fromEither(cache),
		chain((c) => rightIO(c.read({}))),
		fold(() => constant(none), s => () => pipe(s, map(r => r.a)))
	))

	return {
		cache,
		write,
		values
	}
}

const data: NonEmptyArray<string> = ['1']

const update: NonEmptyArray<string> = ['2', '3']

describe('nonEmptyArray', () => {
	it('is reactive', async () => {
		const { write, values } = useCache();

		assert.deepStrictEqual(values.value, none)

		await write({ a: data })

		assert.deepStrictEqual(values.value, some(data))

	}),
	it('evicts new entries', async () => {
		const { values, write } = useCache()

		const evict = await write({ a: data })

		evict()

		assert.deepStrictEqual(values.value, none)

	}),
	it('evicts overwritten entries by returning the previous value', async () => {
		const { values, write } = useCache()

		await write({ a: data })

		const evict = await write({ a: update });

		evict();

		assert.deepStrictEqual(values.value, some(data))

	}),
	it('applies partial updates with mutable arrays', async () => {
		const { values, write } = useCache()

		await write({ a: update })

		await write({ a: data });

		assert.deepStrictEqual(values.value, some(['1', '3']))

	}),
	it('does not apply partial update with immutable arrays', async () => {
		const { values, write } = useCache(true)

		await write({ a: update })

		await write({ a: data });

		assert.deepStrictEqual(values.value, some(data))

	}),
	it('deletes null entries', async () => {
		const { write, values } = useCache();

		await write({ a: update })

		const evict = await write({ a: [null as any]});

		assert.deepStrictEqual(values.value, some(['3']))

		evict();

		assert.deepStrictEqual(values.value, some(update))
	})
})
