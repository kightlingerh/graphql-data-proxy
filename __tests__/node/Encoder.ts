import * as fc from 'fast-check';
import * as assert from 'assert';
import { fromArray } from 'fp-ts/NonEmptyArray';
import { fromNullable } from 'fp-ts/Option';
import * as E from '../../src/model/Encoder';
import * as N from '../../src/node';

describe('encoder', () => {
	it('properly encodes string', () => {
		const stringEncoder = N.useNodeEncoder(N.staticString);
		fc.assert(
			fc.property(fc.string(), (str) => {
				assert.deepStrictEqual(stringEncoder.encode(str), E.id().encode(str));
			})
		);
	}),
	it('properly encodes int', () => {
		const intEncoder = N.useNodeEncoder(N.staticInt);
		fc.assert(
			fc.property(fc.integer(), (int) => {
				assert.deepStrictEqual(intEncoder.encode(int), E.id().encode(int));
			})
		);
	}),
	it('properly encodes float', () => {
		const floatEncoder = N.useNodeEncoder(N.staticFloat);
		fc.assert(
			fc.property(fc.float(), (f) => {
				assert.deepStrictEqual(floatEncoder.encode(f), E.id().encode(f));
			})
		);
	}),
	it('properly encodes boolean', () => {
		const booleanEncoder = N.useNodeEncoder(N.staticBoolean);
		fc.assert(
			fc.property(fc.boolean(), (b) => {
				assert.deepStrictEqual(booleanEncoder.encode(b), E.id().encode(b));
			})
		);
	}),
	it('properly encodes option', () => {
		const optionIntNodeEncoder = N.useNodeEncoder(N.option(N.staticInt));
		const optionIntEncoder = E.option(E.int);
		fc.assert(
			fc.property(fc.option(fc.integer()), (int) => {
				assert.deepStrictEqual(
					optionIntNodeEncoder.encode(fromNullable(int)),
					optionIntEncoder.encode(fromNullable(int))
				);
			})
		);
	});
	it('properly encodes array', () => {
		const arrayNodeEncoder = N.useNodeEncoder(N.array(N.staticInt));
		const arrayEncoder = E.array(E.int);
		fc.assert(
			fc.property(fc.array(fc.integer()), (as) => {
				assert.deepStrictEqual(arrayNodeEncoder.encode(as), arrayEncoder.encode(as));
			})
		);
	}),
	it('properly encodes nonEmptyArray', () => {
		const optionNonEmptyArrayNodeEncoder = N.useNodeEncoder(N.option(N.nonEmptyArray(N.staticInt)));
		const optionNonEmptyArrayEncoder = E.option(E.nonEmptyArray(E.int));
		fc.assert(
			fc.property(fc.array(fc.integer()), (as) => {
				assert.deepStrictEqual(
					optionNonEmptyArrayNodeEncoder.encode(fromArray(as)),
					optionNonEmptyArrayEncoder.encode(fromArray(as))
				);
			})
		);
	}),
	it('properly encodes map', () => {
		const mapNodeEncoder = N.useNodeEncoder(N.map(N.staticString, N.staticInt));
		const mapEncoder = E.map<Record<string, number>, string, number>(Object.fromEntries)(E.string, E.int);
		fc.assert(
			fc.property(fc.array(fc.tuple(fc.string(), fc.integer())), (entries) => {
				const m = new Map(entries);
				assert.deepStrictEqual(mapNodeEncoder.encode(m), mapEncoder.encode(m));
			})
		);
	}),
	it('properly encodes type', () => {
		const typeNodeEncoder = N.useNodeEncoder(
			N.type('Test', {
				a: N.staticInt,
				b: N.staticBoolean
			})
		);
		const typeEncoder = E.type({
			a: E.int,
			b: E.boolean
		});
		fc.assert(
			fc.property(
				fc.record({
					a: fc.integer(),
					b: fc.boolean()
				}),
				(t) => {
					assert.deepStrictEqual(typeNodeEncoder.encode(t), typeEncoder.encode(t));
				}
			)
		);
	}),
	it('properly encodes sum', () => {
		const sumNodeEncoder = N.useNodeEncoder(
			N.sum([N.type('A', { a: N.staticInt }), N.type('B', { b: N.staticBoolean })])
		);
		const sumEncoder = E.sum('__typename')({
			A: E.type({ __typename: E.id<'A'>(), a: E.int }),
			B: E.type({ __typename: E.id<'B'>(), b: E.boolean })
		});
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
					assert.deepStrictEqual(sumNodeEncoder.encode(t), sumEncoder.encode(t));
				}
			)
		);
	});
});
