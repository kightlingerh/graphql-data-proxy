import * as fc from 'fast-check'
import * as assert from 'assert'
import * as D from '../../src/model/Decoder'
import * as N from '../../src/node'

describe('decoder', () => {
	it('properly decodes string', () => {
		const stringDecoder = N.useStrictNodeDecoder(N.staticString)
		fc.assert(
			fc.property(fc.string(), (str) => {
				assert.deepStrictEqual(stringDecoder.decode(str), D.string.decode(str))
			})
		)
	}),
		it('properly decodes int', () => {
			const intDecoder = N.useStrictNodeDecoder(N.staticInt)
			fc.assert(
				fc.property(fc.integer(), (int) => {
					assert.deepStrictEqual(intDecoder.decode(int), D.int.decode(int))
				})
			)
		}),
		it('properly decodes float', () => {
			const floatDecoder = N.useStrictNodeDecoder(N.staticFloat)
			fc.assert(
				fc.property(fc.float(), (f) => {
					assert.deepStrictEqual(floatDecoder.decode(f), D.float.decode(f))
				})
			)
		}),
		it('properly decodes boolean', () => {
			const booleanDecoder = N.useStrictNodeDecoder(N.staticBoolean)
			fc.assert(
				fc.property(fc.boolean(), (b) => {
					assert.deepStrictEqual(booleanDecoder.decode(b), D.boolean.decode(b))
				})
			)
		}),
		it('properly decodes option', () => {
			const optionIntNodeDecoder = N.useStrictNodeDecoder(N.option(N.staticInt))
			const optionIntDecoder = D.fromOption(D.int)
			fc.assert(
				fc.property(fc.option(fc.integer()), (int) => {
					assert.deepStrictEqual(optionIntNodeDecoder.decode(int), optionIntDecoder.decode(int))
				})
			)
		})
	it('properly decodes array', () => {
		const arrayNodeDecoder = N.useStrictNodeDecoder(N.array(N.staticInt))
		const arrayDecoder = D.fromArray(D.int)
		fc.assert(
			fc.property(fc.array(fc.integer()), (as) => {
				assert.deepStrictEqual(arrayNodeDecoder.decode(as), arrayDecoder.decode(as))
			})
		)
	}),
		it('properly decodes nonEmptyArray', () => {
			const optionNonEmptyArrayNodeDecoder = N.useStrictNodeDecoder(N.nonEmptyArray(N.staticInt))
			const optionNonEmptyArrayDecoder = D.fromNonEmptyArray(D.int)
			fc.assert(
				fc.property(fc.array(fc.integer()), (as) => {
					assert.deepStrictEqual(
						optionNonEmptyArrayNodeDecoder.decode(as),
						optionNonEmptyArrayDecoder.decode(as)
					)
				})
			)
		}),
		it('properly decodes map', () => {
			const mapNodeDecoder = N.useStrictNodeDecoder(N.map(N.staticString, N.staticInt))
			const mapDecoder = D.fromMap(Object.entries)(D.string, D.int)
			fc.assert(
				fc.property(fc.array(fc.tuple(fc.string(), fc.integer())), (entries) => {
					const rec = Object.fromEntries(entries)
					assert.deepStrictEqual(mapNodeDecoder.decode(rec), mapDecoder.decode(rec))
				})
			)
		}),
		it('properly decodes type', () => {
			const typeNodeDecoder = N.useStrictNodeDecoder(
				N.type('Test', {
					a: N.staticInt,
					b: N.staticBoolean
				})
			)
			const typeDecoder = D.fromType({
				a: D.int,
				b: D.boolean
			})
			fc.assert(
				fc.property(
					fc.record({
						a: fc.integer(),
						b: fc.boolean()
					}),
					(t) => {
						assert.deepStrictEqual(typeNodeDecoder.decode(t), typeDecoder.decode(t))
					}
				)
			)
		}),
		it('properly decodes sum', () => {
			const sumNodeDecoder = N.useStrictNodeDecoder(
				N.sum([N.type('A', { a: N.staticInt }), N.type('B', { b: N.staticBoolean })])
			)
			const sumDecoder = D.fromSum('__typename')({
				A: D.fromType({ __typename: D.id<'A'>(), a: D.int }),
				B: D.fromType({ __typename: D.id<'B'>(), b: D.boolean })
			})
			fc.assert(
				fc.property(
					fc.oneof(
						fc.record({
							__typename: fc.constant('A' as const),
							a: fc.integer()
						}),
						fc.record({
							__typename: fc.constant('B' as const),
							b: fc.boolean()
						})
					),
					(t) => {
						assert.deepStrictEqual(sumNodeDecoder.decode(t), sumDecoder.decode(t))
					}
				)
			)
		})
})
