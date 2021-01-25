import * as assert from 'assert'
import { constant, constVoid, pipe } from 'fp-ts/function'
import { chain, fromEither, rightIO, getOrElse, fold } from 'fp-ts/IOEither'
import * as IO from 'fp-ts/IO'
import { Option, none, map, some, chain as chainO } from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { computed, shallowRef } from 'vue'
import * as N from '../../src/node'
import { make } from '../../src/cache/Cache'

const HighSchoolEducation = N.type(
	'HighSchoolEducation',
	{
		city: N.staticString,
		graduated: N.staticBoolean
	},
	{ includeTypename: true }
)

const CollegeEducation = N.type(
	'CollegeEducation',
	{
		city: N.staticString,
		graduated: N.staticInt,
		major: N.staticString
	},
	{ includeTypename: true }
)

const Schema = N.schema('Sum', {
	education: N.sum([HighSchoolEducation, CollegeEducation])
})

interface Education extends N.TypeOf<typeof Schema> {}

const highSchool: N.TypeOf<typeof HighSchoolEducation> = {
	__typename: 'HighSchoolEducation',
	city: 'La Canada',
	graduated: true
}

const highSchoolUpdate: N.TypeOfPartial<typeof HighSchoolEducation> = {
	graduated: false
}

const updatedHighSchool = {
	...highSchool,
	...highSchoolUpdate
}

const college: N.TypeOf<typeof CollegeEducation> = {
	__typename: 'CollegeEducation',
	city: 'Davis',
	major: 'Economics',
	graduated: 2014
}

function useCache() {
	const cache = make({})(Schema)(Schema)
	const write = (data: N.TypeOfPartial<typeof Schema>) =>
		pipe(
			TE.fromEither(cache),
			TE.chain((c) => TE.fromTask(c.write({})(data))),
			TE.getOrElse(() => async () => constVoid)
		)()

	const read = pipe(
		fromEither(cache),
		chain((c) => rightIO(c.read({}))),
		getOrElse(() => constant(none as Option<Education>)),
		IO.map(map((s: any) => s.education))
	)
	const city = computed(() =>
		pipe(
			fromEither(cache),
			chain((c) => rightIO(c.toEntries({}))),
			fold(
				() => constant(shallowRef(none)),
				(e) => () => e.education
			),
			IO.map((e) =>
				pipe(
					e.value,
					map((ed) => ed.city),
					chainO((edc) => edc.value)
				)
			)
		)()
	)

	return {
		city,
		cache,
		write,
		read
	}
}

describe('sum', () => {
	it('is reactive', async () => {
		const { write, read } = useCache()

		const ref = computed(read)

		assert.deepStrictEqual(ref.value, none)

		await write({ education: highSchool })

		assert.deepStrictEqual(ref.value, some(highSchool))
	}),
		it('will properly evict', async () => {
			const { write, read } = useCache()

			const ref = computed(read)

			await write({ education: highSchool })

			const evictHighSchoolUpdate = await write({ education: highSchoolUpdate })

			assert.deepStrictEqual(ref.value, some(updatedHighSchool))

			evictHighSchoolUpdate()

			assert.deepStrictEqual(ref.value, some(highSchool))

			const evictCollege = await write({ education: college })

			assert.deepStrictEqual(ref.value, some(college))

			evictCollege()

			assert.deepStrictEqual(ref.value, some(highSchool))
		}),
		it('will not evict if overwritten', async () => {
			const { write, read } = useCache()

			const ref = computed(read)

			const evict = await write({ education: highSchool })

			await write({ education: college })

			evict()

			assert.deepStrictEqual(ref.value, some(college))
		})
})
