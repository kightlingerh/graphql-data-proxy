import {constant, FunctionN, identity, Lazy} from 'fp-ts/lib/function';
import { IO } from 'fp-ts/lib/IO'
import * as R from 'fp-ts/lib/Reader';
import {VariablesNode} from '../schema/Node';
import * as N from '../schema/Node';
import {isEmptyObject, isFunction, Ref} from '../shared';

export interface Cache<TNode extends N.Node> {
	write(data: N.ExtractModelType<TNode>, variables: ExtractVariablesType<TNode>): IO<Evict>
	read(variables: ExtractVariablesType<TNode>): IO<N.ExtractModelType<TNode>>
	toRefs(variables: ExtractVariablesType<TNode>): IO<N.ExtractStoreType<TNode>>
	toRef(variables: ExtractVariablesType<TNode>): IO<Ref<N.ExtractModelType<TNode>>>
}

type Evict = IO<void>

export type ExtractVariablesType<S extends N.Node> = keyof N.ExtractMergedVariables<S> extends never ? undefined : N.ExtractVariables<N.ExtractMergedVariables<S>>

export interface OfRef {
	<T>(value?: T): Ref<T>;
}

export function cache<S extends N.Schema<any>>(schema: S): R.Reader<OfRef, Cache<S>> {
	return of => {

	};
}

function write<T extends N.Node>(node: T, store: N.ExtractStoreType<T>, data: N.ExtractModelType<T>, variables: ExtractVariablesType<T>): IO<Evict> {

}

function isVariableStore<T, V extends VariablesNode = {}>(store: N.Store<T, V>): store is FunctionN<[N.ExtractVariables<V>], N.Ref<T>> {
	return isFunction(store);
}


export function store<T extends N.Node>(node: T): R.Reader<OfRef, any> {
	if (node.store) {
		return () => node.store;
	}
	switch (node.tag) {
		case 'Schema':
		case 'Type':
			return type(node as N.TypeNode<any, any, any>);
		case 'Array':
			return array(node);
		case 'Map':
			return map(node);
		case 'NonEmptyArray':
			return nonEmptyArray(node);
		case 'Option':
			return option(node)
		case 'Sum':
			return sum(node);
		case 'Mutation':
			return mutation(node)
		case 'Number':
		case 'Boolean':
		case 'String':
		case 'Scalar':
			return make(node.variables);
	}};

export function type<T extends TypeNode<any, any, any>>(
	node: T
): R.Reader<OfRef, N.Store<{ [K in keyof T]: N.ExtractStoreType<T[K]> }, V>> {
	return of => {
		const members = node.members;
		if (isEmptyObject(node.variables)) {
			const x = {};
			for (const [key, value] of Object.entries(members)) {
				x[key] = store(members[key]);
			}
			return of(x);
		} else {

		}
	};
}

export function array<T extends Node, V extends VariablesNode = {}>(node: N.ArrayNode<T, V>): R.Reader<OfRef, N.Store<ExtractStoreType<T>[], V>> {
	return make(node.variables, of => constant(of([])))
}

export function nonEmptyArray(): R.Reader<OfRef, any> {
	return of => {

	};
}

export function map(): R.Reader<OfRef, any> {
	return of => {};
}

export function option(): R.Reader<OfRef, any> {
	return of => {};
}

export function sum(): R.Reader<OfRef, any> {
	return of => {};
}

export function mutation(): R.Reader<OfRef, any> {
	return of => {};
};

export function scalar<Name extends string, T, V extends N.VariablesNode = {}>(node: N.ScalarNode<Name, T, V>): R.Reader<OfRef, N.Store<T, V>> {
	return make(node.variables);
}

export function string<V extends N.VariablesNode = {}>(node: N.StringNode<V>): R.Reader<OfRef, N.Store<string, V>> {
	return make(node.variables)
}

export function number<V extends N.VariablesNode = {}>(node: N.NumberNode<V>): R.Reader<OfRef, N.Store<number, V>> {
	return make(node.variables)
}

export function boolean<V extends N.VariablesNode = {}>(node: N.BooleanNode<V>): R.Reader<OfRef, N.Store<boolean, V>> {
	return make(node.variables)
}

function make<T, V extends N.VariablesNode = {}>(variables: V): R.Reader<OfRef, N.Store<T, V>> {
	return of => {
		if (isEmptyObject(variables)) {
			return of<T>() as N.Store<T, V>;
		} else {
			const variablesModel = N.getVariablesModel(variables as V);
			const results = new Map<unknown, Ref<T>>();
			return ((variables) => {
				const encodedVariables = variablesModel.encode(variables);
				const result = results.get(encodedVariables);
				if (result) {
					return result;
				} else {
					const newResult = of<T>();
					results.set(encodedVariables, newResult);
					return newResult;
				}
			}) as N.Store<T, V>;
		}
	};
}


