import * as assert from 'assert'
import { getOrElse, isRight } from 'fp-ts/lib/Either'
import { constant, constVoid, pipe } from 'fp-ts/lib/function'
import { chain, fromEither, rightIO } from 'fp-ts/lib/IOEither'
import { isNone, isSome } from 'fp-ts/lib/Option'
import { make } from '../../src/cache/Cache'
import * as N from '../../src/node/index'
import { Person1, Person1CompleteUpdate, Person1Variables, Person2, PersonNode } from '../shared'

describe('evict', () => {
	it('evict should clear entire write', () => {
		const cache = make({})(PersonNode)(PersonNode)
		assert.deepStrictEqual(isRight(cache), true)
		const evict = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write(Person1Variables)(Person1)))
		)()
		assert.deepStrictEqual(isRight(evict), true)
		const read = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read(Person1Variables)))
		)
		const preEvictReadResult = read()
		assert.deepStrictEqual(isRight(preEvictReadResult) && isSome(preEvictReadResult.right), true)
		pipe(evict, getOrElse(constant(constVoid)))()
		const postEvictReadResult = read()
		assert.deepStrictEqual(isRight(postEvictReadResult) && isNone(postEvictReadResult.right), true)
	}),
		it('evict map entry should revert to previous map', () => {
			const request = N.pickFromType(PersonNode, 'id', 'statistics')
			const cache = make({})(PersonNode)(request)
			assert.deepStrictEqual(isRight(cache), true)

			const Person1WithStatistics = {
				id: Person1.id,
				statistics: Person1.statistics
			}

			const read = pipe(
				fromEither(cache),
				chain((c) => rightIO(c.read(Person1Variables)))
			)

			// initial write
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.write(Person1Variables)(Person1WithStatistics)))
			)()

			const Person1Update = {
				statistics: Person2.statistics
			}

			const Person1Final = {
				...Person1WithStatistics,
				...Person1Update
			}

			// apply update
			const updateEvict = pipe(
				fromEither(cache),
				chain((c) => rightIO(c.write(Person1Variables)(Person1Update)))
			)()

			assert.deepStrictEqual(isRight(updateEvict), true)

			const postUpdateReadResult = read()

			assert.deepStrictEqual(
				isRight(postUpdateReadResult) && isSome(postUpdateReadResult.right) && postUpdateReadResult.right.value,
				Person1Final
			)
			// apply evict
			pipe(updateEvict, getOrElse(constant(constVoid)))()

			const postEvictReadResult = read()

			assert.deepStrictEqual(
				isRight(postEvictReadResult) && isSome(postEvictReadResult.right) && postEvictReadResult.right.value,
				Person1WithStatistics
			)
		}),
		it('evict array should revert to previous array', getPersonalInfoEvictTest('siblings')),
		it('evict option should revert to previous option', getPersonalInfoEvictTest('pictureUrl')),
		it('nonEmptyArray option should revert to previous nonEmptyArray', getPersonalInfoEvictTest('parents'))
})

function getPersonalInfoEvictTest(key: keyof typeof Person1.personalInfo) {
	return () => {
		const request = N.omitFromType(PersonNode, 'statistics')
		const cache = make({})(PersonNode)(request)
		assert.deepStrictEqual(isRight(cache), true)

		const Person1NoStatistics = {
			id: Person1.id,
			personalInfo: Person1.personalInfo
		}

		const read = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read({})))
		)

		// initial write
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(Person1NoStatistics)))
		)()

		const Person1Update = {
			personalInfo: {
				[key]: (Person1CompleteUpdate as any).personalInfo[key]
			}
		}

		const Person1Final = {
			...Person1NoStatistics,
			personalInfo: {
				...Person1NoStatistics.personalInfo,
				...Person1Update.personalInfo
			}
		}

		// apply update
		const updateEvict = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write({})(Person1Update)))
		)()

		assert.deepStrictEqual(isRight(updateEvict), true)

		const postUpdateReadResult = read()

		assert.deepStrictEqual(
			isRight(postUpdateReadResult) && isSome(postUpdateReadResult.right) && postUpdateReadResult.right.value,
			Person1Final
		)
		// apply evict
		pipe(updateEvict, getOrElse(constant(constVoid)))()

		const postEvictReadResult = read()

		assert.deepStrictEqual(
			isRight(postEvictReadResult) && isSome(postEvictReadResult.right) && postEvictReadResult.right.value,
			Person1NoStatistics
		)
	}
}
