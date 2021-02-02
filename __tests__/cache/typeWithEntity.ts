import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold, getOrElse } from 'fp-ts/IOEither'
import { some } from 'fp-ts/lib/Option'
import { Option, none } from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { computed, shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const EmployerNode = N.type(
	'Employer',
	{
		id: N.staticString,
		name: N.staticString
	},
	{
		isEntity: true,
		variables: {
			id: N.staticString
		}
	}
)

const TypeWithEntityNode = N.schema('Type', {
	employer: EmployerNode
})

interface Person extends N.TypeOf<typeof TypeWithEntityNode> {}

const variables = {
	id: 'test'
}

function useCache() {
	const cache = make({})(TypeWithEntityNode)(TypeWithEntityNode)
	const write = (data: N.TypeOfPartial<typeof TypeWithEntityNode>) =>
		pipe(
			TE.fromEither(cache),
			TE.chain((c) => TE.fromTask(c.write(variables)(data))),
			TE.getOrElse(() => async () => constVoid)
		)()

	const read = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.read(variables))),
		getOrElse(() => constant(none as Option<Person>))
	)

	const employer = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.toEntries(variables))),
		fold(
			() => constant(shallowRef(none)),
			(entries) => () => entries.employer
		)
	)()

	return {
		cache,
		write,
		read,
		employer
	}
}

const person: Person = {
	employer: {
		id: 'PFM',
		name: 'Public Financial Management'
	}
}

const update: N.TypeOfPartial<typeof TypeWithEntityNode> = {
	employer: {
		id: 'DeepSport',
		name: 'DeepSport, Inc.'
	}
}

const updated = {
	...person,
	...update
}

describe('type with entity', () => {
	it('has reactive reads', async () => {
		const { write, read } = useCache()

		const ref = computed(read)

		assert.deepStrictEqual(ref.value, none)

		await write(person)

		assert.deepStrictEqual(ref.value, some(person))
	}),
		it('has reactive refs', async () => {
			const { write, employer } = useCache()

			assert.deepStrictEqual(employer.value, none)

			await write(person)

			assert.deepStrictEqual(employer.value, some(person.employer))

			await write(update)

			assert.deepStrictEqual(employer.value, some(updated.employer))
		})
})
