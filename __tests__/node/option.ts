import * as fc from 'fast-check'
import * as assert from 'assert'
import { fromNullable } from 'fp-ts/Option'
import * as N from '../../src/node'
import * as M from '../../src/model'

const OptionNode = N.option(N.staticInt)

const OptionModel = M.fromOption(M.int)

describe('option', () => {
	it('properly constructs strict model', async () => {
		await fc.assert(
			fc.asyncProperty(fc.option(fc.integer()), async (int) => {
				assert.deepStrictEqual(
					OptionNode.strict.encode(fromNullable(int)),
					OptionModel.encode(fromNullable(int))
				)
				const intOption = fromNullable(int)
				const [d1, d2] = await Promise.all([OptionNode.strict.decode(int)(), OptionModel.decode(int)()])
				assert.deepStrictEqual(d1, d2)
				assert.deepStrictEqual(OptionNode.strict.is(intOption), OptionModel.is(intOption))
			})
		)
	})
})
