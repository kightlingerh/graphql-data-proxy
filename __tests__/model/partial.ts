import * as assert from 'assert'
import * as fc from 'fast-check';
import * as M from '../../src/model'

const model = M.partial({
	a: M.string,
	b: M.number,
})

describe('partial', () => {
	it('encode', () => {

		fc.assert(fc.property(fc.string(), s => {
			return assert.deepStrictEqual(model.encode({ a: s }), { a: s })
		}))

		fc.assert(fc.property(fc.float(), b => {
			return assert.deepStrictEqual(model.encode({ b }), { b })
		}))

	}),
	it('encode', () => {

		fc.assert(fc.property(fc.string(), s => {
			return assert.deepStrictEqual(model.encode({ a: s }), { a: s })
		}))

		fc.assert(fc.property(fc.float(), b => {
			return assert.deepStrictEqual(model.encode({ b }), { b })
		}))

	})
})
