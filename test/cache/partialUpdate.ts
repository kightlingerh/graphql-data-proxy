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

const Person1: N.TypeOf<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: none
	}
}

const Person1Update: N.TypeOfPartial<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		highSchool: some('La Canada High School')
	}
}

const Person1Final: N.TypeOfPartial<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		...Person1.personalInfo,
		...Person1Update.personalInfo
	}
}

describe('partial update', () => {
	it('should apply partial update to cache entry', () => {
		const cache = make(PersonNode)({})(PersonNode)
		assert.deepStrictEqual(isRight(cache), true)

		// initial write
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(Person1)))
		)()

		const read = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read({})))
		)
		const preUpdateReadResult = read()

		assert.deepStrictEqual(
			isRight(preUpdateReadResult) && isSome(preUpdateReadResult.right) && preUpdateReadResult.right.value,
			Person1
		)

		//update
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(Person1Update)))
		)()

		const postUpdateReadResult = read()

		assert.deepStrictEqual(
			isRight(postUpdateReadResult) && isSome(postUpdateReadResult.right) && postUpdateReadResult.right.value,
			Person1Final
		)
	})
})
