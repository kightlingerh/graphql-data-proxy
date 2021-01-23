import * as assert from 'assert'
import {right} from 'fp-ts/Either';
import {constant, constVoid, pipe} from 'fp-ts/function';
import {chain, fromEither, rightIO, fold} from 'fp-ts/IOEither';
import {some, none, getOrElse, Option} from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {computed, Ref, shallowRef} from 'vue';
import * as N from '../../src/node';
import { make } from '../../src/cache/Cache'

const schema = N.schema('Test', { a: N.option(N.staticString) })

function useCache() {
	const cache = make({})(schema)(schema);

	const write = (data: N.TypeOf<typeof schema>) => pipe(
		TE.fromEither(cache),
		TE.chain((c) => TE.fromTask(c.write({})(data))),
		TE.getOrElse(() => async () => constVoid)
	)()

	const ref = computed(() => pipe(
		fromEither(cache),
		chain((c) => rightIO(c.toEntries({}))),
		fold(() => constant(shallowRef(none)), entries => () => {
			return pipe(entries.a.value, getOrElse<Ref<Option<string>>>(constant(shallowRef(none))));
		})
	)().value)

	const read = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.read({}))),
	)

	return {
		cache,
		ref,
		write,
		read
	}
}


describe('option', () => {
	it('is reactive', async () => {
		const { ref, write } = useCache();

		assert.deepStrictEqual(ref.value, none)

		const writeValue = { a: some('1') }

		await write(writeValue)

		assert.deepStrictEqual(ref.value, writeValue.a)
	}),
	it('can evict to none', async () => {
		const { ref, write } = useCache();

		const writeValue = { a: some('1') }

		const evict1 = await write(writeValue)

		assert.deepStrictEqual(ref.value, writeValue.a)

		evict1();

		assert.deepStrictEqual(ref.value, none)

	}),
	it('can evict to previous value', async () => {
		const { ref, write } = useCache();

		const data = { a: some('1') };

		await write(data)

		const update = { a: some('2') };

		const evict = await write(update);

		evict();

		assert.deepStrictEqual(ref.value, data.a)

	}),
	it('can read', async () => {
		const { read, write } = useCache();

		const data = { a: some('1') }

		assert.deepStrictEqual(read(), right(none))

		await write(data)

		assert.deepStrictEqual(read(), right(some(data)))

	})
})
