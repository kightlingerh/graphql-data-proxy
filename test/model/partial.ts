import * as assert from 'assert'
import { right } from 'fp-ts/lib/Either'
import * as M from '../../src/model'

describe('partial model', () => {
	it('should decode partial object', () => {
		const partialModel = M.partial({
			a: M.string,
			b: M.map(M.string, M.number)
		})

		assert.deepStrictEqual(partialModel.decode({ a: 'foo' }), right({ a: 'foo' }))

		assert.deepStrictEqual(partialModel.decode({ b: { a: 1 } }), right({ b: new Map([['a', 1]]) }))
	}),
		it('should encode a partial object', () => {
			const partialModel = M.partial({
				a: M.string,
				b: M.map(M.string, M.number)
			})

			assert.deepStrictEqual(partialModel.encode({ a: 'foo' }), { a: 'foo' })

			assert.deepStrictEqual(partialModel.encode({ b: new Map([['a', 1]]) }), { b: { a: 1 } })
		})
})
