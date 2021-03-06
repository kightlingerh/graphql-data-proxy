import { Either } from 'fp-ts/lib/Either';
import { eqStrict } from 'fp-ts/lib/Eq';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { Option } from 'fp-ts/lib/Option';
import * as EQ from './Eq';
import * as EN from './Encoder';
import * as D from './Decoder';
import * as G from './Guard';
import { constNull, Lazy } from 'fp-ts/lib/function';
import { Literal } from './Schemable';

export interface Model<I, O, A> extends D.Decoder<I, A>, EN.Encoder<O, A>, G.Guard<unknown, A>, EQ.Eq<A> {}

export type TypeOf<M> = M extends Model<any, any, infer A> ? A : never;

export const string: Model<string, string, string> = {
	equals: EQ.string.equals,
	is: G.string.is,
	decode: D.string.decode,
	encode: EN.string.encode
};

export const number: Model<number, number, number> = {
	equals: EQ.number.equals,
	is: G.number.is,
	decode: D.number.decode,
	encode: EN.number.encode
};

export const int: Model<number, number, G.Int> = {
	equals: EQ.int.equals,
	is: G.int.is,
	decode: D.int.decode,
	encode: EN.int.encode
};

export const float: Model<number, number, G.Float> = {
	equals: EQ.float.equals,
	is: G.float.is,
	decode: D.float.decode,
	encode: EN.float.encode
};

export const boolean: Model<boolean, boolean, boolean> = {
	equals: EQ.boolean.equals,
	is: G.boolean.is,
	decode: D.boolean.decode,
	encode: EN.boolean.encode
};

export function literal<A extends readonly [Literal, ...Array<Literal>]>(
	...values: A
): Model<unknown, A[number], A[number]> {
	return {
		equals: eqStrict.equals,
		is: G.literal(...values).is,
		decode: D.literal(...values).decode,
		encode: EN.id<A[number]>().encode
	};
}

export function fromType<P extends Record<string, Model<any, any, any>>>(
	properties: P
): Model<{ [K in keyof P]: D.InputOf<P[K]> }, { [K in keyof P]: EN.OutputOf<P[K]> }, { [K in keyof P]: TypeOf<P[K]> }> {
	return {
		equals: EQ.type(properties).equals,
		is: G.type(properties).is,
		decode: D.fromType(properties).decode,
		encode: EN.type(properties).encode
	} as any;
}

export function type<P extends Record<string, Model<any, any, any>>>(
	properties: P
): Model<unknown, { [K in keyof P]: EN.OutputOf<P[K]> }, { [K in keyof P]: TypeOf<P[K]> }> {
	return fromType(properties) as any;
}

export function fromPartial<P extends Record<string, Model<any, any, any>>>(
	properties: P
): Model<
	Partial<{ [K in keyof P]: D.InputOf<P[K]> }>,
	Partial<{ [K in keyof P]: EN.OutputOf<P[K]> }>,
	Partial<{ [K in keyof P]: TypeOf<P[K]> }>
> {
	return {
		equals: EQ.partial(properties).equals,
		is: G.partial(properties).is,
		decode: D.fromPartial(properties).decode,
		encode: EN.partial(properties).encode
	} as any;
}

export function partial<P extends Record<string, Model<any, any, any>>>(
	properties: P
): Model<unknown, Partial<{ [K in keyof P]: EN.OutputOf<P[K]> }>, Partial<{ [K in keyof P]: TypeOf<P[K]> }>> {
	return fromPartial(properties) as any;
}

export function fromArray<I, O, A>(item: Model<I, O, A>): Model<Array<I>, Array<O>, Array<A>> {
	return {
		equals: EQ.array(item).equals,
		is: G.array(item).is,
		decode: D.fromArray(item).decode,
		encode: EN.array(item).encode
	};
}

export function array<O, A>(item: Model<unknown, O, A>): Model<unknown, Array<O>, Array<A>> {
	return fromArray(item) as Model<unknown, Array<O>, Array<A>>;
}

export function fromNonEmptyArray<I, O, A>(item: Model<I, O, A>): Model<Array<I>, Array<O>, NonEmptyArray<A>> {
	return {
		equals: EQ.nonEmptyArray(item).equals,
		is: G.nonEmptyArray(item).is,
		decode: D.fromNonEmptyArray(item).decode,
		encode: EN.nonEmptyArray(item).encode
	};
}

export function nonEmptyArray<O, A>(val: Model<unknown, O, A>): Model<unknown, Array<O>, NonEmptyArray<A>> {
	return fromNonEmptyArray(val) as Model<unknown, Array<O>, NonEmptyArray<A>>;
}

export function fromMap<I, IK, IA, O, OK, OA, K, A>(
	toPairs: (input: I) => Array<[IK, IA]>,
	fromPairs: (pairs: Array<[OK, OA]>) => O
) {
	return (key: Model<IK, OK, K>, item: Model<IA, OA, A>): Model<I, O, Map<K, A>> => {
		return {
			equals: EQ.map(key, item).equals,
			is: G.map(key, item).is,
			decode: D.fromMap<I, IK, IA, K, A>(toPairs)(key, item).decode,
			encode: EN.map<O, OK, OA, K, A>(fromPairs)(key, item).encode
		};
	};
}

export function map(
	toPairs: (input: unknown) => Array<[unknown, unknown]>,
	fromPairs: (pairs: Array<[unknown, unknown]>) => unknown
) {
	return <K, A>(
		key: Model<unknown, unknown, K>,
		item: Model<unknown, unknown, A>
	): Model<unknown, unknown, Map<K, A>> => {
		return fromMap<unknown, unknown, unknown, unknown, unknown, unknown, K, A>(toPairs, fromPairs)(key, item);
	};
}

export function fromSet<I, O, A>(item: Model<I, O, A>): Model<Array<I>, Array<O>, Set<A>> {
	return {
		equals: EQ.set(item).equals,
		is: G.set(item).is,
		decode: D.fromSet(item).decode,
		encode: EN.set(item).encode
	};
}

export function set<O, A>(item: Model<unknown, O, A>): Model<unknown, Array<O>, Set<A>> {
	return fromSet(item) as any;
}

export function fromOption<I, O, A>(item: Model<I, O, A>): Model<I | null, O | null, Option<A>>;
export function fromOption<I, O, A>(item: Model<I, O, A>, lazy: Lazy<O>): Model<I | null, O, Option<A>>;
export function fromOption<I, O, A>(item: Model<I, O, A>, lazy: Lazy<O | null> = constNull): any {
	return {
		equals: EQ.option(item).equals,
		is: G.option(item).is,
		decode: D.fromOption(item).decode,
		encode: EN.option(item, lazy).encode
	};
}

export function option<O, A>(item: Model<unknown, O, A>): Model<unknown, O | null, Option<A>>;
export function option<O, A>(item: Model<unknown, O, A>, lazy: Lazy<O>): Model<unknown, O, Option<A>>;
export function option<O, A>(item: Model<unknown, O, A>, lazy: Lazy<O | null> = constNull): any {
	return fromOption(item, lazy);
}

export const optionString = fromOption(string);

export const optionNumber = fromOption(number);

export const optionBoolean = fromOption(boolean);

export function fromEither<IL, OL, L, IR, OR, R>(
	left: Model<IL, OL, L>,
	right: Model<IR, OR, R>
): Model<IL | IR, OL | OR, Either<L, R>> {
	return {
		equals: EQ.either(left, right).equals,
		is: G.either(left, right).is,
		encode: EN.either(left, right).encode,
		decode: D.fromEither(left, right).decode
	};
}

export function either<L, R>(
	left: Model<unknown, unknown, L>,
	right: Model<unknown, unknown, R>
): Model<unknown, unknown, Either<L, R>> {
	return fromEither(left, right);
}

export function nullable<I, O, A>(item: Model<I, O, A>): Model<I | null, O | null, A | null> {
	return {
		equals: EQ.nullable(item).equals,
		is: G.nullable(item).is,
		decode: D.nullable(item).decode,
		encode: EN.nullable(item).encode
	};
}

export function fromSum<T extends string>(
	tag: T
): <MS extends Record<string, Model<any, any, any>>>(
	members: MS
) => Model<D.InputOf<MS[keyof MS]>, EN.OutputOf<MS[keyof MS]>, TypeOf<MS[keyof MS]>> {
	const eq = EQ.sum(tag);
	const guard = G.sum(tag);
	const decoder = D.fromSum(tag);
	const encoder = EN.sum(tag);
	return (members) =>
		({
			equals: eq(members).equals,
			is: guard(members).is,
			decode: decoder(members).decode,
			encode: encoder(members).encode
		} as any);
}

export function sum<T extends string>(
	tag: T
): <MS>(
	members: { [K in keyof MS]: Model<unknown, unknown, MS[K] & Record<T, K>> }
) => Model<unknown, unknown, MS[keyof MS]> {
	const s = fromSum(tag);
	return (members) => s(members) as any;
}

export function fromTuple<MS extends ReadonlyArray<Model<any, any, any>>>(
	...members: MS
): Model<
	{ [K in keyof MS]: D.InputOf<MS[K]> },
	{ [K in keyof MS]: EN.OutputOf<MS[K]> },
	{ [K in keyof MS]: TypeOf<MS[K]> }
> {
	return {
		equals: EQ.tuple(...members).equals,
		is: G.tuple(...members).is,
		decode: D.fromTuple(...members).decode,
		encode: EN.tuple(...members).encode
	} as any;
}

export function lazy<I, O, A>(id: string, model: Lazy<Model<I, O, A>>): Model<I, O, A> {
	return {
		equals: EQ.lazy(model).equals,
		is: G.lazy(model).is,
		decode: D.lazy(id, model).decode,
		encode: EN.lazy(model).encode
	};
}

export function useEncoder<I, O, A>(model: Model<I, O, A>) {
	return <OB>(encoder: EN.Encoder<OB, A>): Model<I, OB, A> => ({
		...model,
		encode: encoder.encode
	});
}

export function useIdentityEncoder<I, O, A>(model: Model<I, O, A>): Model<I, A, A> {
	return useEncoder(model)(EN.id());
}

export function encodeById<I, O, A extends Record<'id', Literal>>(model: Model<I, O, A>): Model<I, Literal, A> {
	return {
		...model,
		encode: (a) => EN.id<Literal>().encode(a.id)
	};
}

export function useEq<I, O, A>(model: Model<I, O, A>, eq: EQ.Eq<A>): Model<I, O, A> {
	return {
		...model,
		...eq
	};
}

export function eqById<I, O, A extends Record<'id', Literal>>(model: Model<I, O, A>): Model<I, O, A> {
	return {
		...model,
		equals: (x, y) => x.id === y.id
	};
}

export function useDecoder<I, O, A>(model: Model<I, O, A>) {
	return <IB>(decoder: D.Decoder<IB, A>): Model<IB, O, A> => ({
		...model,
		decode: decoder.decode
	});
}

export function useIdentityDecoder<I, O, A>(model: Model<I, O, A>): Model<A, O, A> {
	return useDecoder(model)({
		decode: D.success
	});
}
