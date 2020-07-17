import * as assert from 'assert'
import { isRight } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import { chain, fromEither, rightIO } from 'fp-ts/lib/IOEither'
import { isSome, none, some } from 'fp-ts/lib/Option'
import { make } from '../../src/cache/Cache'
import * as M from '../../src/model/index'
import * as N from '../../src/node/index'

export const IdNode = N.scalar('Id', M.string)

const PersonalInfoNode = N.type('PersonalInfo', {
	pictureUrl: N.option(N.staticString),
	firstName: N.staticString,
	lastName: N.staticString,
	highSchool: N.option(N.staticString)
})

const PersonNode = N.type('Person', {
	id: IdNode,
	personalInfo: PersonalInfoNode
})

const PEOPLE_CACHE = new Map()

function usePeopleCache() {
	return PEOPLE_CACHE
}

const AllPeopleNode = N.useCustomCache(N.map(IdNode, PersonNode), usePeopleCache)

const PeopleNode = N.useCustomCache(
	N.map(IdNode, PersonNode, {
		ids: N.nonEmptyArray(IdNode)
	}),
	usePeopleCache
)

const People = N.type('People', {
	allPeople: AllPeopleNode,
	people: PeopleNode
})

const Person1: N.TypeOf<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: some('La Canada High School')
	}
}

const Person2: N.TypeOf<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		pictureUrl: none,
		firstName: 'Sam',
		lastName: 'Baldwin',
		highSchool: none
	}
}

const PeopleRequest = N.pickFromType(People, 'people')

const AllPeopleRequest = N.pickFromType(People, 'allPeople')

const PeopleData: N.TypeOf<typeof PeopleRequest> = {
	people: new Map([[Person1.id, Person1]])
}

const AllPeopleData: N.TypeOf<typeof AllPeopleRequest> = {
	allPeople: new Map([[Person2.id, Person2]])
}

const PeopleReqeustVariables: N.TypeOfMergedVariables<typeof People> = {
	ids: ['some-id']
}

describe('useCustomCache', () => {
	it('nodes that use same custom cache should hold equivalent data', () => {
		const peopleCache = make(People)({})(PeopleRequest)
		const allPeopleCache = make(People)({})(AllPeopleRequest)
		assert.deepStrictEqual(isRight(peopleCache) && isRight(allPeopleCache), true)

		pipe(
			fromEither(peopleCache),
			chain((c) => rightIO(c.write(PeopleReqeustVariables)(PeopleData)))
		)()

		pipe(
			fromEither(allPeopleCache),
			chain((c) => rightIO(c.write({})(AllPeopleData)))
		)()

		const peopleCacheReadResult = pipe(
			fromEither(peopleCache),
			chain((c) => rightIO(c.read(PeopleReqeustVariables)))
		)()

		const allPeopleCacheReadResult = pipe(
			fromEither(allPeopleCache),
			chain((c) => rightIO(c.read({})))
		)()

		assert.deepStrictEqual(
			isRight(peopleCacheReadResult) &&
				isSome(peopleCacheReadResult.right) &&
				peopleCacheReadResult.right.value.people,
			isRight(allPeopleCacheReadResult) &&
				isSome(allPeopleCacheReadResult.right) &&
				allPeopleCacheReadResult.right.value.allPeople
		)
	})
})
