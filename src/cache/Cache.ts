import { IO } from 'fp-ts/lib/IO'
import {IOEither} from 'fp-ts/lib/IOEither';
import {isNone, none, some} from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Reader'
import {isLeft} from 'fp-ts/lib/These';
import {DecodeError} from 'io-ts/lib/Decoder';
import {Node} from '../schema/Node';
import * as N from '../schema/Node'
import { isEmptyObject, isFunction, Ref } from '../shared'

export interface Cache<TNode extends N.Node> {
	unsafeWrite(data: unknown, variables: ExtractMergedVariablesType<TNode>): IOEither<DecodeError, Evict>
	write(data: N.ExtractModelType<TNode>, variables: ExtractMergedVariablesType<TNode>): IO<Evict>
	read(variables: ExtractMergedVariablesType<TNode>): IO<N.ExtractModelType<TNode>>
	toRefs(variables: ExtractMergedVariablesType<TNode>): IO<N.ExtractStoreType<TNode>>
	toRef(variables: ExtractMergedVariablesType<TNode>): IO<Ref<N.ExtractModelType<TNode>>>
}

type Evict = IO<void>

export type ExtractMergedVariablesType<S extends N.Node> = keyof N.ExtractMergedVariables<S> extends never
	? undefined
	: N.ExtractVariables<N.ExtractMergedVariables<S>>

export interface OfRef {
	<T>(value?: T): Ref<T>
}

export function cache<S extends N.Schema<any>>(schema: S): R.Reader<OfRef, Cache<S>> {
	return (of) => {}
}

function write<T extends N.Node>(
	node: T,
	store: N.ExtractStoreType<T>,
	data: N.ExtractModelType<T>,
	mergedVariables: ExtractMergedVariablesType<T>
): IO<Evict> {
	switch (node.tag) {
		case 'Boolean':
		case 'Number':
		case 'String':
		case 'Scalar':
			return writeLiteralOrScalar(store, data, extractNodeVariables(node, mergedVariables));
	}
}

function writeType<T extends N.TypeNode<string, any, any>>(
	node: T,
	store: N.ExtractStoreType<T>,
	data: N.ExtractModelType<T>,
	mergedVariables: ExtractMergedVariablesType<T>
): IO<Evict> {
	return () => {
		const ref = isFunction(store) ? store(extractNodeVariables(node, mergedVariables)) : store;
		if (isNone(ref.value)) {

		}
	};
}

function extractNodeVariables<T extends N.Node>(node: T, mergedVariables: ExtractMergedVariablesType<T>): N.ExtractVariables<T['variables']> {
	const x: any = {};
	Object.keys(node.variables).forEach(key => {
		x[key] = mergedVariables && mergedVariables[key];
	});
	return x;
}

function writeLiteralOrScalar<T extends N.Node>(
	store: N.ExtractStoreType<T>,
	data: N.ExtractModelType<T>,
	variables: N.ExtractVariables<T['variables']>
): IO<Evict> {
	return () => {
		const ref = isFunction(store) ? store(variables) : store;
		const currentValue = ref.value;
		const newValue = some(data);
		ref.value = newValue;
		return () => {
			if (ref.value === newValue) {
				ref.value = currentValue;
			}
		};
	}
}


export function store<T extends N.Node>(node: T): R.Reader<OfRef, any> {
	if (node.store) {
		return () => node.store
	}
	switch (node.tag) {
		case 'Schema':
		case 'Type':
			return type(node as N.TypeNode<any, any, any>)
		case 'Array':
			return array(node )
		case 'Map':
			return map(node)
		case 'NonEmptyArray':
			return nonEmptyArray(node)
		case 'Option':
			return option(node)
		case 'Sum':
			return sum(node)
		case 'Mutation':
			return mutation(node)
		case 'Number':
		case 'Boolean':
		case 'String':
		case 'Scalar':
			return make(node)
	}
}

export function type<T extends N.TypeNode<any, any, any>>(
	node: T
): R.Reader<OfRef, T['store']> {
	function subStore(of: OfRef): N.ExtractStoreRefType<T> {
		const members = node.members
		const x: any = {}
		Object.keys(members).forEach(key => {
			x[key] = store(members[key])(of)
		})
		return x;
	}
	return make(node, subStore);
}

export function array<T extends N.ArrayNode<any, any>>(
	node: T
): R.Reader<OfRef, T['store']> {
	function subStore(of: OfRef): N.ExtractStoreRefType<T> {
		return [store(node.wrapped)(of)] as N.ExtractStoreRefType<T>;
	}
	return make(node, subStore)
}

export function nonEmptyArray<T extends N.NonEmptyArrayNode<any, any>>(
	node: T
): R.Reader<OfRef, T['store']> {
	function subStore(of: OfRef): N.ExtractStoreRefType<T> {
		return [store(node.wrapped)(of)] as N.ExtractStoreRefType<T>;
	}
	return make(node, subStore)
}

export function map<T extends N.MapNode<any, any, any>>(
	node: T
): R.Reader<OfRef, T['store']> {
	function subStore(): N.ExtractStoreRefType<T> {
		return new Map() as N.ExtractStoreRefType<T>;
	}
	return make(node, subStore)
}

export function option<T extends N.OptionNode<any, any>>(
	node: T
): R.Reader<OfRef, T['store']> {
	function subStore(): N.ExtractStoreRefType<T> {
		return none as N.ExtractStoreRefType<T>
	}
	return make(node, subStore)
}

export function sum(): R.Reader<OfRef, any> {
	return (of) => {}
}

export function mutation<T extends N.OptionNode<any, any>>(
	node: T
): R.Reader<OfRef, T['store']> {
	function subStore(of: OfRef): N.ExtractStoreRefType<T> {
		return store(node.wrapped)(of)
	}
	return make(node, subStore)
}

function make<T extends N.Node>(node: T, subStore?: R.Reader<OfRef, N.ExtractStoreRefType<T>>): R.Reader<OfRef, N.ExtractStoreType<T>> {
	return (of) => {
		if (isEmptyObject(node.variables)) {
			return of<T>() as N.ExtractStoreType<T>
		} else {
			const results = new Map()
			return ((variables: N.ExtractVariables<T['variables']>) => {
				const encodedVariables = node.variablesModel.encode(variables)
				const result = results.get(encodedVariables)
				if (result) {
					return result
				} else {
					const newResult = of(subStore ? subStore(of) : undefined);
					results.set(encodedVariables, newResult)
					return newResult
				}
			}) as N.ExtractStoreType<T>
		}
	}
}
