import * as assert from 'assert'
import { map } from 'fp-ts/IO'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fold, fromEither, rightIO } from 'fp-ts/IOEither'
import { none, some, chain as chainO } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'

import { computed } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const PersonNode = N.option(
	N.type('Person', {
		id: N.staticString,
		age: N.staticInt,
		weight: N.staticInt,
		name: N.staticString
	}),
	{
		variables: {
			id: N.staticString
		}
	}
)

const SchemaNode = N.schema('TypeWithVariables', {
	person: PersonNode
})

type Person = N.TypeOf<typeof PersonNode>

interface SchemaVariables extends N.TypeOfMergedVariables<typeof SchemaNode> {}

const person1Data: Person = some({
	id: '1',
	age: 29,
	weight: 145,
	name: 'Harry'
})

const person1Variables: SchemaVariables = {
	id: '1'
}

const person2Data: Person = some({
	id: '2',
	age: 27,
	weight: 160,
	name: 'Sam'
})

const person2Variables: SchemaVariables = {
	id: '2'
}

describe('type', () => {
	it('has reactive reads', () => {
		const cache = make({})(SchemaNode).select(SchemaNode)
		const writePerson1 = pipe(
			IOE.fromEither(cache),
			IOE.chain((c) =>
				IOE.fromIO(
					c.write(person1Variables)({
						person: person1Data
					})
				)
			),
			IOE.getOrElse(() => () => constVoid)
		)

		const writePerson2 = pipe(
			IOE.fromEither(cache),
			IOE.chain((c) =>
				IOE.fromIO(
					c.write(person2Variables)({
						person: person2Data
					})
				)
			),
			IOE.getOrElse(() => () => constVoid)
		)

		const person1Ref = computed<Person>(
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.read(person1Variables))),
				fold(
					() => constant(none),
					(a) => constant(a)
				),
				map((a) =>
					pipe(
						a,
						chainO((b) => b.person)
					)
				)
			)
		)

		const person2Ref = computed<Person>(
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.read(person2Variables))),
				fold(
					() => constant(none),
					(a) => constant(a)
				),
				map((a) =>
					pipe(
						a,
						chainO((b) => b.person)
					)
				)
			)
		)

		assert.deepStrictEqual(person1Ref.value, none)

		assert.deepStrictEqual(person2Ref.value, none)

		Promise.all([writePerson1(), writePerson2()])

		assert.deepStrictEqual(person1Ref.value, person1Data)

		assert.deepStrictEqual(person2Ref.value, person2Data)
	})
})
