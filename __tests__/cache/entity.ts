import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold, getOrElse } from 'fp-ts/IOEither'
import { some } from 'fp-ts/lib/Option'
import { Option, none } from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { computed, shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const PersonNode = N.type('Person', {
	age: N.staticInt,
	weight: N.staticInt,
	name: N.staticString
})

interface Person extends N.TypeOf<typeof PersonNode> {}

const SchemaNode = N.schema('Schema', {
	people: N.array(PersonNode, { isEntity: true })
})

interface SchemaData extends N.TypeOf<typeof SchemaNode> {}

const people: Person[] = [
	{
		age: 29,
		weight: 145,
		name: 'Harry'
	}
]

const newPeople = [
	{
		age: 27,
		weight: 160,
		name: 'Sam'
	}
]

function useCache() {
	const cache = make({})(SchemaNode)(SchemaNode)
	const write = (data: N.TypeOfPartial<typeof SchemaNode>) =>
		pipe(
			TE.fromEither(cache),
			TE.chain((c) => TE.fromTask(c.write({})(data))),
			TE.getOrElse(() => async () => constVoid)
		)()

	const read = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.read({}))),
		getOrElse(() => constant(none as Option<SchemaData>))
	)

	const people = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.toEntries({}))),
		fold(
			() => constant(shallowRef(none)),
			(entries) => () => entries.people
		)
	)()

	return {
		cache,
		write,
		read,
		people
	}
}

describe('entity', () => {
	it('has reactive reads', async () => {
		const { write, read } = useCache()

		const ref = computed(read)

		assert.deepStrictEqual(ref.value, none)

		await write({
			people
		})

		assert.deepStrictEqual(
			ref.value,
			some({
				people
			})
		)
	}),
	it('has reactive refs', async () => {
		const { write, people: peopleRef } = useCache()

		assert.deepStrictEqual(peopleRef.value, none)

		await write({ people })

		assert.deepStrictEqual(peopleRef.value, some(people))

		await write({ people: newPeople })

		assert.deepStrictEqual(peopleRef.value, some(newPeople))
	}),
	it('can evict new values', async () => {
		const { write, read } = useCache()

		const ref = computed(read)

		const evict = await write({ people })

		evict()

		assert.deepStrictEqual(ref.value, none)
	})
})
