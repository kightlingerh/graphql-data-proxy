import * as fc from 'fast-check'
import * as assert from 'assert'
import * as E from '../../src/model/Encoder'
import * as D from '../../src/model/Decoder'
import * as G from '../../src/model/Guard'
import * as N from '../../src/node'

describe('variables', () => {
	it('properly encodes variables', () => {
		const nodeVariablesEncoder = N.useNodeVariablesEncoder(N.string({ variables: { a: N.staticInt } }))

		const variablesEncoder = E.type({ a: E.int })
		fc.assert(
			fc.property(fc.integer(), (a) => {
				assert.deepStrictEqual(nodeVariablesEncoder.encode({ a }), variablesEncoder.encode({ a }))
			})
		)
	}),
		it('properly decodes variables', () => {
			const nodeVariablesDecoder = N.useNodeVariablesDecoder(N.string({ variables: { a: N.staticInt } }))

			const variablesDecoder = D.fromType({ a: D.int })
			fc.assert(
				fc.property(fc.integer(), (a) => {
					assert.deepStrictEqual(nodeVariablesDecoder.decode({ a }), variablesDecoder.decode({ a }))
				})
			)
		}),
		it('properly guards variables', () => {
			const nodeVariablesGuard = N.useNodeVariablesGuard(N.string({ variables: { a: N.staticInt } }))

			const variablesGuard = G.type({ a: G.int })
			fc.assert(
				fc.property(fc.oneof(fc.string(), fc.integer()), (a) => {
					assert.deepStrictEqual(nodeVariablesGuard.is({ a }), variablesGuard.is({ a }))
				})
			)
		}),
		it('properly encodes merged variables', () => {
			const nodeVariablesEncoder = N.useNodeMergedVariablesEncoder(
				N.array(N.string({ variables: { a: N.staticInt } }), { variables: { b: N.staticString } })
			)

			const variablesEncoder = E.type({ a: E.int, b: E.string })
			fc.assert(
				fc.property(fc.integer(), fc.string(), (a, b) => {
					assert.deepStrictEqual(nodeVariablesEncoder.encode({ a, b }), variablesEncoder.encode({ a, b }))
				})
			)
		}),
		it('properly decodes merged variables', () => {
			const nodeVariablesDecoder = N.useNodeMergedVariablesDecoder(
				N.array(N.string({ variables: { a: N.staticInt } }), { variables: { b: N.staticString } })
			)

			const variablesDecoder = D.fromType({ a: D.int, b: D.string })
			fc.assert(
				fc.property(fc.integer(), fc.string(), (a, b) => {
					assert.deepStrictEqual(nodeVariablesDecoder.decode({ a, b }), variablesDecoder.decode({ a, b }))
				})
			)
		}),
		it('properly guards merged variables', () => {
			const nodeVariablesGuard = N.useNodeMergedVariablesGuard(
				N.array(N.string({ variables: { a: N.staticInt } }), { variables: { b: N.staticString } })
			)

			const variablesGuard = G.type({ a: G.int, b: G.string })
			fc.assert(
				fc.property(fc.oneof(fc.string(), fc.integer()), fc.oneof(fc.string(), fc.integer()), (a, b) => {
					assert.deepStrictEqual(nodeVariablesGuard.is({ a, b }), variablesGuard.is({ a, b }))
				})
			)
		})
})
