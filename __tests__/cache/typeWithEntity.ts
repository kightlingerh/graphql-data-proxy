import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold, getOrElse } from 'fp-ts/IOEither'
import { some } from 'fp-ts/lib/Option'
import { Option, none } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'
import { computed, shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const EmployerNode = N.type(
	'Employer',
	{
		id: N.staticString,
		name: N.staticString,
		endDate: N.option(N.staticString)
	},
	{
		variables: {
			id: N.staticString
		}
	}
)

const EmployerRequestNode = N.markTypeAsEntity(EmployerNode)

const TypeWithEntityNode = N.schema('Type', {
	employer: EmployerNode
})

const TypeWithEntityRequestNode = N.schema('Type', {
	employer: EmployerRequestNode
})

interface Person extends N.TypeOf<typeof TypeWithEntityNode> {}

const variables = {
	id: 'test'
}

function useCache() {
	const cache = make({})(TypeWithEntityNode).select(TypeWithEntityRequestNode)
	const write = (data: N.TypeOfPartial<typeof TypeWithEntityNode>) =>
		pipe(
			IOE.fromEither(cache),
			IOE.chain((c) => IOE.fromIO(c.write(variables)(data))),
			IOE.getOrElse(() => () => constVoid)
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
		name: 'Public Financial Management',
		endDate: some('12-10-2014')
	}
}

const update: N.TypeOfPartial<typeof TypeWithEntityNode> = {
	employer: {
		id: 'DeepSport',
		name: 'DeepSport, Inc.',
		endDate: none
	}
}

const updated = {
	...person,
	...update
}

describe('type with entity', () => {
	it('has reactive reads', () => {
		const { write, read } = useCache()

		const ref = computed(read)

		assert.deepStrictEqual(ref.value, none)

		write(person)

		assert.deepStrictEqual(ref.value, some(person))
	}),
		it('has reactive refs', () => {
			const { write, employer } = useCache()

			assert.deepStrictEqual(employer.value, none)

			write(person)

			assert.deepStrictEqual(employer.value, some(person.employer))

			write(update)

			assert.deepStrictEqual(employer.value, some(updated.employer))
		})
})
