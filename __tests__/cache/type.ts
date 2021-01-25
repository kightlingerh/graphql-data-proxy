import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold, getOrElse } from 'fp-ts/IOEither'
import { some } from 'fp-ts/lib/Option'
import { Option, none } from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { computed, shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const schema = N.schema('Type', {
	age: N.staticInt,
	weight: N.staticInt,
	name: N.staticString
})

interface Person extends N.TypeOf<typeof schema> {}

function useCache() {
	const cache = make({})(schema)(schema)
	const write = (data: N.TypeOfPartial<typeof schema>) =>
		pipe(
			TE.fromEither(cache),
			TE.chain((c) => TE.fromTask(c.write({})(data))),
			TE.getOrElse(() => async () => constVoid)
		)()

	const read = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.read({}))),
		getOrElse(() => constant(none as Option<Person>))
	)

	const age = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.toEntries({}))),
		fold(
			() => constant(shallowRef(none)),
			(entries) => () => entries.age
		)
	)()

	const weight = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.toEntries({}))),
		fold(
			() => constant(shallowRef(none)),
			(entries) => () => entries.weight
		)
	)()

	const name = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.toEntries({}))),
		fold(
			() => constant(shallowRef(none)),
			(entries) => () => entries.name
		)
	)()

	return {
		cache,
		write,
		read,
		age,
		name,
		weight
	}
}

const person: Person = {
	age: 29,
	weight: 145,
	name: 'Harry'
}

const update: N.TypeOfPartial<typeof schema> = {
	name: 'Sam'
}

const updated = {
	...person,
	...update
}

describe('type', () => {
	it('is reactive', async () => {
		const { write, read } = useCache()

		const ref = computed(read)

		assert.deepStrictEqual(ref.value, none)

		await write(person)

		assert.deepStrictEqual(ref.value, some(person))
	}),
		it('allows partial updates', async () => {
			const { write, read } = useCache()

			const ref = computed(read)

			await write(person)

			await write(update)

			assert.deepStrictEqual(ref.value, some(updated))
		})
})
