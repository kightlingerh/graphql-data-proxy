import * as fc from 'fast-check'
import * as assert from 'assert'
import * as G from '../../src/model/Guard'
import * as N from '../../src/node'

describe('guard', () => {
	it('properly guards string', () => {
		const stringGuard = N.useStrictNodeGuard(N.staticString)
		fc.assert(
			fc.property(fc.string(), (str) => {
				assert.deepStrictEqual(stringGuard.is(str), G.string.is(str))
			})
		)
	}),
		it('properly guards int', () => {
			const intGuard = N.useStrictNodeGuard(N.staticInt)
			fc.assert(
				fc.property(fc.integer(), (int) => {
					assert.deepStrictEqual(intGuard.is(int), G.int.is(int))
				})
			)
		}),
		it('properly guards float', () => {
			const floatGuard = N.useStrictNodeGuard(N.staticFloat)
			fc.assert(
				fc.property(fc.float(), (f) => {
					assert.deepStrictEqual(floatGuard.is(f), G.float.is(f))
				})
			)
		}),
		it('properly guards boolean', () => {
			const booleanGuard = N.useStrictNodeGuard(N.staticBoolean)
			fc.assert(
				fc.property(fc.boolean(), (b) => {
					assert.deepStrictEqual(booleanGuard.is(b), G.boolean.is(b))
				})
			)
		}),
		it('properly guards option', () => {
			const optionIntNodeGuard = N.useStrictNodeGuard(N.option(N.staticInt))
			const optionIntGuard = G.option(G.int)
			fc.assert(
				fc.property(fc.option(fc.integer()), (int) => {
					assert.deepStrictEqual(optionIntNodeGuard.is(int), optionIntGuard.is(int))
				})
			)
		})
	it('properly guards array', () => {
		const arrayNodeGuard = N.useStrictNodeGuard(N.array(N.staticInt))
		const arrayGuard = G.array(G.int)
		fc.assert(
			fc.property(fc.array(fc.integer()), (as) => {
				assert.deepStrictEqual(arrayNodeGuard.is(as), arrayGuard.is(as))
			})
		)
	}),
		it('properly guards nonEmptyArray', () => {
			const optionNonEmptyArrayNodeGuard = N.useStrictNodeGuard(N.nonEmptyArray(N.staticInt))
			const optionNonEmptyArrayGuard = G.nonEmptyArray(G.int)
			fc.assert(
				fc.property(fc.array(fc.integer()), (as) => {
					assert.deepStrictEqual(optionNonEmptyArrayNodeGuard.is(as), optionNonEmptyArrayGuard.is(as))
				})
			)
		}),
		it('properly guards map', () => {
			const mapNodeGuard = N.useStrictNodeGuard(N.map('Test', N.staticString, N.staticInt))
			const mapGuard = G.map(G.string, G.int)
			fc.assert(
				fc.property(fc.array(fc.tuple(fc.string(), fc.integer())), (entries) => {
					const m = new Map(entries)
					assert.deepStrictEqual(mapNodeGuard.is(m), mapGuard.is(m))
				})
			)
		}),
		it('properly guards type', () => {
			const typeNodeGuard = N.useStrictNodeGuard(
				N.type('Test', {
					a: N.staticInt,
					b: N.staticBoolean
				})
			)
			const typeGuard = G.type({
				a: G.int,
				b: G.boolean
			})
			fc.assert(
				fc.property(
					fc.record({
						a: fc.integer(),
						b: fc.boolean()
					}),
					(t) => {
						assert.deepStrictEqual(typeNodeGuard.is(t), typeGuard.is(t))
					}
				)
			)
		}),
		it('properly guards sum', () => {
			const sumNodeGuard = N.useStrictNodeGuard(
				N.sum([N.type('A', { a: N.staticInt }), N.type('B', { b: N.staticBoolean })])
			)
			const sumGuard = G.sum('__typename')({
				A: G.type({ __typename: G.id<'A'>() as G.Guard<unknown, 'A'>, a: G.int }),
				B: G.type({ __typename: G.id<'B'>() as G.Guard<unknown, 'B'>, b: G.boolean })
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
						assert.deepStrictEqual(sumNodeGuard.is(t), sumGuard.is(t))
					}
				)
			)
		})
})
