import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold, getOrElse } from 'fp-ts/IOEither'
import { some } from 'fp-ts/lib/Option'
import { Option, none } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'
import { computed, shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const schema = N.type('Type', {
	age: N.staticInt,
	weight: N.staticInt,
	name: N.staticString
})

interface Person extends N.TypeOf<typeof schema> {}

function useCache() {
	const cache = make({})(schema).select(schema)
	const write = (data: N.TypeOfPartial<typeof schema>) =>
		pipe(
			IOE.fromEither(cache),
			IOE.chain((c) => IOE.fromIO(c.write({})(data))),
			IOE.getOrElse(() => () => constVoid)
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
	it('has reactive reads', () => {
		const { write, read } = useCache()

		const ref = computed(read)

		assert.deepStrictEqual(ref.value, none)

		write(person)

		assert.deepStrictEqual(ref.value, some(person))
	}),
		it('has reactive refs', () => {
			const { write, age, weight, name } = useCache()

			assert.deepStrictEqual(age.value, none)

			assert.deepStrictEqual(weight.value, none)

			assert.deepStrictEqual(name.value, none)

			write(person)

			assert.deepStrictEqual(age.value, some(person.age))

			assert.deepStrictEqual(weight.value, some(person.weight))

			assert.deepStrictEqual(name.value, some(person.name))

			write(update)

			assert.deepStrictEqual(age.value, some(updated.age))

			assert.deepStrictEqual(weight.value, some(updated.weight))

			assert.deepStrictEqual(name.value, some(updated.name))
		}),
		it('allows partial updates', () => {
			const { write, read } = useCache()

			const ref = computed(read)

			write(person)

			write(update)

			assert.deepStrictEqual(ref.value, some(updated))
		})
})
