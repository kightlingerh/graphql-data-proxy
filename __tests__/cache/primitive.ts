import * as assert from 'assert'
import {right} from 'fp-ts/Either';
import {constant, constVoid, pipe} from 'fp-ts/function';
import {chain, fromEither, rightIO, fold} from 'fp-ts/IOEither';
import {none} from 'fp-ts/lib/Option';
import {some} from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {shallowRef} from 'vue';
import * as N from '../../src/node';
import { make } from '../../src/cache/Cache'

const schema = N.schema('Test', { a: N.staticString })
const cache = make({})(schema)(schema);
const write = (data: N.TypeOf<typeof schema>) => pipe(
	TE.fromEither(cache),
	TE.chain((c) => TE.fromTask(c.write({})(data))),
	TE.getOrElse(() => async () => constVoid)
)()

describe('primitive', () => {
	it('is reactive', async () => {
		const ref = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.toEntries({}))),
			fold(() => constant(shallowRef(none)), entries => () => entries.a)
		)()

		assert.deepStrictEqual(ref.value, none)

		const writeValue = { a: '1' }

		await write(writeValue)

		assert.deepStrictEqual(some(writeValue.a), ref.value)
	}),
	it('can evict', async () => {
		const ref = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.toEntries({}))),
			fold(() => constant(shallowRef(none)), entries => () => entries.a)
		)()

		const writeValue = { a: '1' }

		await write(writeValue)

		assert.deepStrictEqual(some(writeValue.a), ref.value)

		const evict = await write({ a: '2' });

		evict()

		assert.deepStrictEqual(some(writeValue.a), ref.value)
	}),
	it('can read', async () => {
		const read = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read({}))),
		)

		const writeValue = { a: '1' }

		await write(writeValue)

		assert.deepStrictEqual(read(), right(some(writeValue)))

	})
})
