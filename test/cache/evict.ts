import * as assert from 'assert'
import { getOrElse, isRight } from 'fp-ts/lib/Either'
import { constant, constVoid, pipe } from 'fp-ts/lib/function'
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
	highSchool: N.option(N.staticString)
})

const PersonNode = N.type('Person', {
	id: IdNode,
	personalInfo: PersonalInfoNode
})

const Person: N.TypeOfPartial<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: some('La Canada High School')
	}
}

const PersonUpdate: N.TypeOfPartial<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		highSchool: some('La Canada High School')
	}
}

const PersonFinal: N.TypeOfPartial<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		...Person.personalInfo,
		...PersonUpdate.personalInfo
	}
}

describe('evict', () => {
	it('evict should clear entire write', () => {
		const cache = make({})(PersonNode)(PersonNode)
		assert.deepStrictEqual(isRight(cache), true)
		const evict = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(Person)))
		)()
		assert.deepStrictEqual(isRight(evict), true)
		const read = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read({})))
		)
		const preEvictReadResult = read()
		assert.deepStrictEqual(isRight(preEvictReadResult) && isSome(preEvictReadResult.right), true)
		pipe(evict, getOrElse(constant(constVoid)))()
		const postEvictReadResult = read()
		assert.deepStrictEqual(isRight(postEvictReadResult) && isNone(postEvictReadResult.right), true)
	}),
		it('evict should clear only partial update', () => {
			const cache = make({})(PersonNode)(PersonNode)
			assert.deepStrictEqual(isRight(cache), true)

			const read = pipe(
				fromEither(cache),
				chain((c) => rightIO(c.read({})))
			)

			// initial write
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.write({})(Person)))
			)()

			// apply update
			const updateEvict = pipe(
				fromEither(cache),
				chain((c) => rightIO(c.write({})(PersonUpdate)))
			)()

			assert.deepStrictEqual(isRight(updateEvict), true)

			const postUpdateReadResult = read()

			assert.deepStrictEqual(
				isRight(postUpdateReadResult) && isSome(postUpdateReadResult.right) && postUpdateReadResult.right.value,
				PersonFinal
			)
			pipe(updateEvict, getOrElse(constant(constVoid)))()

			const postEvictReadResult = read()

			assert.deepStrictEqual(
				isRight(postEvictReadResult) && isSome(postEvictReadResult.right) && postEvictReadResult.right.value,
				Person
			)
		})
})
