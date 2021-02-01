import * as fc from 'fast-check'
import * as assert from 'assert'
import * as N from '../../src/node'
import * as M from '../../src/model'

const DemographicInfoNode = N.type(
	'DemographicInfo',
	{
		age: N.staticInt,
		weight: N.staticInt,
		name: N.staticString
	},
	{ includeTypename: true }
)

const EmploymentInfoNode = N.type(
	'EmploymentInfo',
	{
		employer: N.staticString
	},
	{ includeTypename: true }
)

const InfoSumNode = N.sum([DemographicInfoNode, EmploymentInfoNode])

const SumModel = M.fromSum('__typename')({
	DemographicInfo: DemographicInfoNode.strict,
	EmploymentInfo: EmploymentInfoNode.strict
})

describe('sum', () => {
	it('properly constructs strict model', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.oneof(fc.constant('EmploymentInfo' as const), fc.constant('DemographicInfo' as const)),
				fc.integer(),
				fc.integer(),
				fc.string(),
				fc.string(),
				async (__typename, age, weight, name, employer) => {
					const val =
						__typename === 'EmploymentInfo' ? { __typename, employer } : { __typename, age, weight, name }
					assert.deepStrictEqual(InfoSumNode.strict.encode(val), SumModel.encode(val))
					const [d1, d2] = await Promise.all([InfoSumNode.strict.decode(val)(), SumModel.decode(val)()])
					assert.deepStrictEqual(d1, d2)
					assert.deepStrictEqual(InfoSumNode.strict.is(val), SumModel.is(val))
				}
			)
		)
	})
})