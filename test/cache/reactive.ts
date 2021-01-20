import { computed, shallowRef } from '@vue/reactivity'
import * as assert from 'assert'
import { isRight } from 'fp-ts/lib/Either'
import { constant, pipe } from 'fp-ts/lib/function'
import { chain, fold, fromEither, right, rightIO } from 'fp-ts/lib/IOEither'
import { getOrElse, isNone, isSome, none, some } from 'fp-ts/lib/Option'
import { constEmptyArray } from '../../src/shared'
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

const PersonNode = N.type('Person', {
	id: IdNode,
	personalInfo: PersonalInfoNode
})

const SchemaNode = N.type('Schema', {
	people: N.map(IdNode, PersonNode)
})

const Person1: N.TypeOf<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: none,
		parents: []
	}
}

const People: N.TypeOf<typeof SchemaNode> = {
	people: new Map([[Person1.id, Person1]])
}

const DeletePeople: N.TypeOf<typeof SchemaNode> = {
	people: new Map([[Person1.id, null as any]])
}

const Person1Update: N.TypeOfPartial<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		lastName: 'Baldwin',
		highSchool: some('La Canada High School'),
		parents: ['Jeff', 'Barbara']
	}
}

const Person1Final: N.TypeOf<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		...Person1.personalInfo,
		...Person1Update.personalInfo
	}
}

describe('reactivity', () => {
	it('computed cache listener should react to cache updates', () => {
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
			chain((c) => rightIO(c.write({})(Person1Update)))
		)()

		assert.deepStrictEqual(
			isRight(cacheResult.value) && isSome(cacheResult.value.right) && cacheResult.value.right.value,
			Person1Final
		)
	}),
		it('toEntries should return reactive objects', () => {
			const cache = make({})(PersonNode)(PersonNode)
			assert.deepStrictEqual(isRight(cache), true)

			const readParents = pipe(
				fromEither(cache),
				chain((c) => rightIO(c.toRefs({}))),
				chain((refs) => right(refs.personalInfo.parents)),
				fold(constant(constant(shallowRef(none))), (parentsRef) => () => parentsRef)
			)

			const parents = computed(() => pipe(readParents().value, getOrElse<string[]>(constEmptyArray)))

			// parents is empty

			assert.deepStrictEqual(parents.value, [])

			// initial write
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.write({})(Person1)))
			)()

			// cache value is updated
			assert.deepStrictEqual(parents.value, Person1.personalInfo.parents)

			//update
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.write({})(Person1Update)))
			)()

			assert.deepStrictEqual(parents.value, Person1Final.personalInfo.parents)
		}),
		it('should delete null map entries', () => {
			const cache = make({})(SchemaNode)(SchemaNode)
			assert.deepStrictEqual(isRight(cache), true)

			const toPeople = pipe(
				fromEither(cache),
				chain((c) => rightIO(c.toRefs({}))),
				fold(constant(constant(new Map())), (refs) => () => refs.people.value)
			)

			const people = computed(toPeople)

			// parents is empty

			assert.deepStrictEqual(people.value, new Map())

			// initial write
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.write({})(People)))
			)()

			// cache value is updated
			assert.deepStrictEqual(people.value.size, 1)

			//update
			pipe(
				fromEither(cache),
				chain((c) => rightIO(c.write({})(DeletePeople)))
			)()

			assert.deepStrictEqual(people.value, new Map())
		})
})
