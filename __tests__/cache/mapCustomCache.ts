import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, fold } from 'fp-ts/IOEither'
import { Option, none, some } from 'fp-ts/Option'
import * as IOE from 'fp-ts/IOEither'
import { computed } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const toId = (path: N.Path) => path[path.length - 2]

const PersonNode = N.type('Person', {
	allFriends: N.map(N.staticString, N.staticString, {
		useCustomCache: {
			toId
		}
	}),
	friends: N.map(N.staticString, N.staticString, {
		variables: {
			friendIds: N.nonEmptyArray(N.staticString)
		},
		useCustomCache: {
			toId
		}
	})
})

interface Person extends N.TypeOf<typeof PersonNode> {}

const PeopleId = constant('people')

// we want the people and allPeople entries to point to the same map at the root level
// for a person, we want the friends and allFriends entries to point to the same map within each Person

const SchemaNode = N.schema('MapWithCustomCache', {
	allPeople: N.map(N.staticString, PersonNode, {
		useCustomCache: {
			toId: PeopleId
		}
	}),
	people: N.map(N.staticString, PersonNode, {
		variables: {
			peopleIds: N.nonEmptyArray(N.staticString)
		},
		useCustomCache: {
			toId: PeopleId
		}
	})
})

export interface SchemaVariables extends N.TypeOfMergedVariables<typeof SchemaNode> {}

export interface SchemaData extends N.TypeOf<typeof SchemaNode> {}

const variables: SchemaVariables = {
	friendIds: ['1'],
	peopleIds: ['1']
}

const person1Friends = new Map([['1', '1']])

const person1AllFriends = new Map([['2', '2']])

const person1CombinedFriends = new Map([...person1Friends.entries(), ...person1AllFriends.entries()])

const person1: Person = {
	friends: person1Friends,
	allFriends: person1AllFriends
}

const person1Combined: Person = {
	friends: person1CombinedFriends,
	allFriends: person1CombinedFriends
}

const person2Friends = new Map([['3', '3']])

const person2AllFriends = new Map([['4', '4']])

const person2CombinedFriends = new Map([...person2Friends.entries(), ...person2AllFriends.entries()])

const person2: Person = {
	friends: person2Friends,
	allFriends: person2AllFriends
}

const person2Combined: Person = {
	friends: person2CombinedFriends,
	allFriends: person2CombinedFriends
}

const allPeople = new Map([['1', person1]])

const people = new Map([['2', person2]])

const combinedPeople = new Map([
	['1', person1Combined],
	['2', person2Combined]
])

const writeData: SchemaData = {
	allPeople: allPeople,
	people: people
}

const readData: SchemaData = {
	allPeople: combinedPeople,
	people: combinedPeople
}

describe('map with custom cache', () => {
	it('properly extracts entries by id', () => {
		const cache = make({})(SchemaNode)(SchemaNode)
		pipe(
			IOE.fromEither(cache),
			IOE.chain((c) => IOE.fromIO(c.write(variables)(writeData))),
			IOE.getOrElse(() => () => constVoid)
		)()

		const ref = computed<Option<SchemaData>>(
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.read(variables))),
				fold(
					() => constant(none),
					(a) => constant(a)
				)
			)
		)

		assert.deepStrictEqual(ref.value, some(readData))
	})
})
