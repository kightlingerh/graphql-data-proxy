import * as fc from 'fast-check'
import * as assert from 'assert'
import * as N from '../../src/node'
import * as M from '../../src/model'

const TypeNodeModel = N.schema('Type', {
	age: N.staticInt,
	weight: N.staticInt,
	name: N.staticString
}).strict

const TypeModel = M.type({
	age: M.int,
	weight: M.int,
	name: M.string
})

describe('type', () => {
	it('properly constructs strict model', async () => {
		await fc.assert(
			fc.asyncProperty(fc.integer(), fc.integer(), fc.string(), async (age, weight, name) => {
				const val = { age, weight, name }
				assert.deepStrictEqual(TypeNodeModel.encode(val), TypeModel.encode(val))
				const [d1, d2] = await Promise.all([TypeNodeModel.decode(val)(), TypeModel.decode(val)()])
				assert.deepStrictEqual(d1, d2)
				assert.deepStrictEqual(TypeNodeModel.is(val), TypeModel.is(val))
			})
		)
	})
})
