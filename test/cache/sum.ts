import { computed } from '@vue/reactivity'
import * as assert from 'assert'
import { isRight } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import { chain, fromEither, rightIO } from 'fp-ts/lib/IOEither'
import { isNone, isSome, none, some } from 'fp-ts/lib/Option'
import { make } from '../../src/cache/Cache'
import * as M from '../../src/model/index'
import * as N from '../../src/node/index'

export const IdNode = N.scalar('Id', M.string)

const PersonalInfoNode = N.type('PersonalInfo', {
	pictureUrl: N.option(N.staticString),
	firstName: N.staticString,
	lastName: N.staticString,
	highSchool: N.option(N.staticString),
	parents: N.markAsEntity(N.array(N.staticString))
})

const ProfessionalInfoNode = N.type('ProfessionalInfo', {
	company: N.option(N.staticString)
})

const InfoNode = N.sum(PersonalInfoNode, ProfessionalInfoNode)()

const PersonNode = N.type('Person', {
	id: IdNode,
	info: InfoNode
})

const Person1: N.TypeOf<typeof PersonNode> = {
	id: '1',
	info: {
		__typename: 'PersonalInfo',
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: none,
		parents: []
	}
}

const Person1SameTypeUpdate: N.TypeOfPartial<typeof PersonNode> = {
	id: '1',
	info: {
		lastName: 'Baldwin',
		highSchool: some('La Canada High School'),
		parents: ['Jeff', 'Barbara']
	}
}

const Person1SameTypeFinal: N.TypeOf<typeof PersonNode> = {
	id: '1',
	info: {
		...Person1.info,
		...Person1SameTypeUpdate.info
	} as any
}

const Person1NewTypeUpdate: N.TypeOf<typeof PersonNode> = {
	id: '1',
	info: {
		__typename: 'ProfessionalInfo',
		company: some('DeepSport')
	}
}

const Person1NewTypeFinal = Person1NewTypeUpdate

describe('reactivity', () => {
	it('should be able to read and write sum types', () => {
		const cache = make({})(PersonNode)(PersonNode)
		assert.deepStrictEqual(isRight(cache), true)

		const read = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read({})))
		)

		const cacheResult = computed(read)

		// cache read is none

		assert.deepStrictEqual(isRight(cacheResult.value) && isNone(cacheResult.value.right), true)

		// initial write
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(Person1)))
		)()

		// cache value is updated
		assert.deepStrictEqual(
			isRight(cacheResult.value) && isSome(cacheResult.value.right) && cacheResult.value.right.value,
			Person1
		)

		//update
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(Person1SameTypeUpdate)))
		)()

		assert.deepStrictEqual(
			isRight(cacheResult.value) && isSome(cacheResult.value.right) && cacheResult.value.right.value,
			Person1SameTypeFinal
		)

		//update
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(Person1NewTypeUpdate)))
		)()

		assert.deepStrictEqual(
			isRight(cacheResult.value) && isSome(cacheResult.value.right) && cacheResult.value.right.value,
			Person1NewTypeFinal
		)
	})
})
