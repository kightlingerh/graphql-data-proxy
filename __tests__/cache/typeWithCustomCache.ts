import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold } from 'fp-ts/IOEither'
import { some } from 'fp-ts/lib/Option'
import { Option, none } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'
import { computed } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const PersonNode = N.type(
	'Person',
	{
		id: N.staticString,
		firstName: N.staticString,
		lastName: N.staticString
	},
	{
		useCustomCache: {
			toId: (_1, _2, data) => {
				return data && data.id
			}
		}
	}
)

const SchemaNode = N.schema('TypeWithCustomCache', {
	user: PersonNode,
	people: N.array(PersonNode)
})

interface SchemaData extends N.TypeOf<typeof SchemaNode> {}

const person = {
	id: '1',
	firstName: 'Harry'
}

const update = {
	id: '1',
	lastName: 'Kightlinger'
}

const updated: N.TypeOf<typeof PersonNode> = {
	...person,
	...update
}

const writeData: N.TypeOfPartial<typeof SchemaNode> = {
	user: person,
	people: [update]
}

const readData: SchemaData = {
	user: updated,
	people: [updated]
}

describe('type with custom cache', () => {
	it('properly creates entries based on toId function', () => {
		const cache = make({})(SchemaNode)(SchemaNode)
		const write = (data: N.TypeOfPartial<typeof SchemaNode>) =>
			pipe(
				IOE.fromEither(cache),
				IOE.chain((c) => IOE.fromIO(c.write({})(data))),
				IOE.getOrElse(() => () => constVoid)
			)()

		const ref = computed<Option<SchemaData>>(
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.read({}))),
				fold(
					() => constant(none),
					(a) => constant(a)
				)
			)
		)

		write(writeData)

		assert.deepStrictEqual(ref.value, some(readData))
	})
})
