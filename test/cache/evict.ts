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

const PersonData: N.TypeOfPartial<typeof PersonNode> = {
	id: 'some-id',
	personalInfo: {
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: some('La Canada High School')
	}
}

describe('evict', () => {
	it('evict should clear cache', () => {
		const cache = make(PersonNode)({})(PersonNode)
		assert.deepStrictEqual(isRight(cache), true)
		const evict = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(PersonData)))
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
	})
})
