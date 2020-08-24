import { computed } from '@vue/reactivity'
import * as assert from 'assert'
import { isRight } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import { chain, fromEither, rightIO } from 'fp-ts/lib/IOEither'
import { isNone, isSome, some } from 'fp-ts/lib/Option'
import { make } from '../../src/cache/Cache'
import * as M from '../../src/model/index'
import * as N from '../../src/node/index'

export const IdNode = N.scalar('Id', M.string)

const StatisticsNode = N.map(N.staticString, N.option(N.staticFloat), {
	date: N.staticString
})

const PersonNode = N.type('Person', {
	id: IdNode,
	statistics: StatisticsNode
})

const Person1Date1: N.TypeOf<typeof PersonNode> = {
	id: '1',
	statistics: new Map([['1', some(1.5)]])
}

const Person1Date1Update: N.TypeOfPartial<typeof PersonNode> = {
	id: '1',
	statistics: new Map([['1', some(2.0)]])
}

const Person1Date2: N.TypeOf<typeof PersonNode> = {
	id: '1',
	statistics: new Map([['1', some(5)]])
}

const Person1Date2Update: N.TypeOf<typeof PersonNode> = {
	id: '1',
	statistics: new Map([['1', some(3.5)]])
}

const Date1Variables = { date: '11/17/1991' }

const Date2Variables = { date: '11/18/1991' }

describe('dynamic nodes', () => {
	it('nodes with different variables should point to different entries', () => {
		const cache = make({})(PersonNode)(PersonNode)
		assert.deepStrictEqual(isRight(cache), true)

		const readDate1 = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read(Date1Variables)))
		)

		const readDate2 = pipe(
			fromEither(cache),
			chain((c) => rightIO(c.read(Date2Variables)))
		)

		const cacheResultDate1 = computed(readDate1)

		const cacheResultDate2 = computed(readDate2)

		// cache read is none

		assert.deepStrictEqual(isRight(cacheResultDate1.value) && isNone(cacheResultDate1.value.right), true)
		assert.deepStrictEqual(isRight(cacheResultDate2.value) && isNone(cacheResultDate2.value.right), true)

		// initial write
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write(Date1Variables)(Person1Date1)))
		)()
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write(Date2Variables)(Person1Date2)))
		)()

		// cache value is updated
		assert.deepStrictEqual(
			isRight(cacheResultDate1.value) &&
				isSome(cacheResultDate1.value.right) &&
				cacheResultDate1.value.right.value,
			Person1Date1
		)
		assert.deepStrictEqual(
			isRight(cacheResultDate2.value) &&
				isSome(cacheResultDate2.value.right) &&
				cacheResultDate2.value.right.value,
			Person1Date2
		)

		//update
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write(Date1Variables)(Person1Date1Update)))
		)()

		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.write(Date2Variables)(Person1Date2Update)))
		)()

		assert.deepStrictEqual(
			isRight(cacheResultDate1.value) &&
				isSome(cacheResultDate1.value.right) &&
				cacheResultDate1.value.right.value,
			Person1Date1Update
		)
		assert.deepStrictEqual(
			isRight(cacheResultDate2.value) &&
				isSome(cacheResultDate2.value.right) &&
				cacheResultDate2.value.right.value,
			Person1Date2Update
		)
	})
})
