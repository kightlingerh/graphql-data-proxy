import { isNonEmpty } from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import { constVoid } from 'fp-ts/lib/function'
import { IO } from 'fp-ts/lib/IO'
import * as IOE from 'fp-ts/lib/IOEither'
import { Monoid } from 'fp-ts/lib/Monoid'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { isNone, none, some } from 'fp-ts/lib/Option'
import * as R from 'fp-ts/lib/Reader'
import { Tree } from 'fp-ts/lib/Tree'
import { tree } from 'io-ts/lib/Decoder'
import { isWrappedNode } from '../schema/Node'
import * as N from '../schema/Node'
import { isEmptyObject, isFunction, Ref } from '../shared'

export interface Cache {
	write<TNode extends N.Node>(
		node: TNode,
		data: N.ExtractPartialModelType<TNode>,
		variables: ExtractMergedVariablesType<TNode>
	): CacheResult<Evict>
	read<TNode extends N.Node>(
		node: TNode,
		variables: ExtractMergedVariablesType<TNode>
	): CacheResult<N.ExtractModelType<TNode>>
	toRefs<TNode extends N.Node>(
		node: TNode,
		variables: ExtractMergedVariablesType<TNode>
	): CacheResult<N.ExtractRefType<TNode>>
	toRef<TNode extends N.Node>(
		node: TNode,
		variables: ExtractMergedVariablesType<TNode>
	): CacheResult<Ref<N.ExtractModelType<TNode>>>
}

interface CacheWriteResult extends CacheResult<Evict> {}

interface CacheResult<T> extends IOE.IOEither<CacheError, T> {}

interface Evict extends IO<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export type ExtractMergedVariablesType<S extends N.Node> = keyof N.ExtractMergedVariables<S> extends never
	? undefined
	: N.ExtractVariables<N.ExtractMergedVariables<S>>

export interface OfRef {
	<T>(value?: T): Ref<T>
}

export function cache<S extends N.Schema<any>>(schema: S): R.Reader<OfRef, Cache> {
	return (of) => {}
}

function write<SchemaNode extends N.Node, RequestNode extends N.Node>(
	cacheNode: SchemaNode,
	requestNode: RequestNode,
	ref: N.ExtractRefType<SchemaNode>,
	data: N.ExtractModelType<RequestNode>,
	mergedVariables: ExtractMergedVariablesType<RequestNode>
): R.Reader<OfRef, CacheResult<Evict>> {
	switch (cacheNode.tag) {
		case 'Boolean':
		case 'Number':
		case 'String':
		case 'Scalar':
			return writeLiteralOrScalar(store, data, extractNodeVariables(node, mergedVariables))
	}
}

const cacheWriteResultMonoid: Monoid<CacheWriteResult> = {
	empty: IOE.right(constVoid),
	concat: (x, y) => {
		return () => {
			const xResult = x()
			const yResult = y()
			if (E.isLeft(xResult) && E.isLeft(yResult)) {
				return E.left<CacheError, Evict>([...xResult.left, ...yResult.left] as CacheError)
			} else if (E.isLeft(xResult) && E.isRight(yResult)) {
				yResult.right()
				return xResult
			} else if (E.isLeft(yResult) && E.isRight(xResult)) {
				xResult.right()
				return yResult
			} else if (E.isRight(xResult) && E.isRight(yResult)) {
				return E.right(() => {
					xResult.right()
					yResult.right()
				})
			} else {
				return E.right(constVoid)
			}
		}
	}
}

function writeType<T extends N.TypeNode<string, any, any>>(
	node: T,
	store: N.ExtractStoreType<T>,
	data: N.ExtractModelType<T>,
	mergedVariables: ExtractMergedVariablesType<T>
): IO<Evict> {
	return () => {
		const ref = isFunction(store) ? store(extractNodeVariables(node, mergedVariables)) : store
		if (isNone(ref.value)) {
		}
	}
}

function extractNodeVariables<T extends N.Node>(
	node: T,
	mergedVariables: ExtractMergedVariablesType<T>
): N.ExtractVariables<T['variables']> {
	const x: any = {}
	Object.keys(node.variables).forEach((key) => {
		x[key] = mergedVariables && mergedVariables[key]
	})
	return x
}

function writeLiteralOrScalar<SchemaNode extends N.Node, RequestNode extends N.Node>(
	cacheNode: SchemaNode,
	requestNode: RequestNode,
	store: N.ExtractStoreType<T>,
	data: N.ExtractModelType<T>,
	variables: N.ExtractVariables<T['variables']>
): CacheResult<Evict> {
	return () => {
		const ref = isFunction(store) ? store(variables) : store
		const currentValue = ref.value
		const newValue = some(data)
		ref.value = newValue
		return () => {
			if (ref.value === newValue) {
				ref.value = currentValue
			}
		}
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
			return array(node)
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

export function type<T extends N.TypeNode<any, any, any>>(node: T): R.Reader<OfRef, T['store']> {
	function subStore(of: OfRef): N.ExtractStoreRefTypeFromNode<T> {
		const members = node.members
		const x: any = {}
		Object.keys(members).forEach((key) => {
			x[key] = store(members[key])(of)
		})
		return x
	}
	return make(node, subStore)
}

export function array<T extends N.ArrayNode<any, any>>(node: T): R.Reader<OfRef, T['store']> {
	function subStore(of: OfRef): N.ExtractStoreRefTypeFromNode<T> {
		return [store(node.wrapped)(of)] as N.ExtractStoreRefTypeFromNode<T>
	}
	return make(node, subStore)
}

export function nonEmptyArray<T extends N.NonEmptyArrayNode<any, any>>(node: T): R.Reader<OfRef, T['store']> {
	function subStore(of: OfRef): N.ExtractStoreRefTypeFromNode<T> {
		return [store(node.wrapped)(of)] as N.ExtractStoreRefTypeFromNode<T>
	}
	return make(node, subStore)
}

export function map<T extends N.MapNode<any, any, any>>(node: T): R.Reader<OfRef, T['store']> {
	function subStore(): N.ExtractStoreRefTypeFromNode<T> {
		return new Map() as N.ExtractStoreRefTypeFromNode<T>
	}
	return make(node, subStore)
}

export function option<T extends N.OptionNode<any, any>>(node: T): R.Reader<OfRef, T['store']> {
	function subStore(): N.ExtractStoreRefTypeFromNode<T> {
		return none as N.ExtractStoreRefTypeFromNode<T>
	}
	return make(node, subStore)
}

export function sum(): R.Reader<OfRef, any> {
	return (of) => {}
}

export function mutation<T extends N.OptionNode<any, any>>(node: T): R.Reader<OfRef, T['store']> {
	function subStore(of: OfRef): N.ExtractStoreRefTypeFromNode<T> {
		return store(node.wrapped)(of)
	}
	return make(node, subStore)
}

function make<T extends N.Node>(
	node: T,
	subStore?: R.Reader<OfRef, N.ExtractStoreRefTypeFromNode<T>>
): R.Reader<OfRef, N.ExtractStoreType<T>> {
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
					const newResult = of(subStore ? subStore(of) : undefined)
					results.set(encodedVariables, newResult)
					return newResult
				}
			}) as N.ExtractStoreType<T>
		}
	}
}

function validate<S extends N.Schema<any>>(schema: S) {
	const validations: Map<N.Schema<any>, Array<Tree<string>>> = new Map();
	return <R extends N.Schema<any>>(request: R): Array<Tree<string>> => {
		const validation = validations.get(request);
		if (validation) {
			return validation;
		} else {
			const newValidation = validateNode(schema, request);
			validations.set(request, newValidation);
			return newValidation;
		}
	}

}

function validateNode<SchemaNode extends N.Node, RequestNode extends N.Node>(
	x: SchemaNode,
	y: RequestNode
): Array<Tree<string>> {
	if (N.isWrappedNode(x) && N.isWrappedNode(y)) {
		return validateWrappedNode(x.wrapped, y.wrapped)
	} else if ((N.isTypeNode(x) && N.isTypeNode(y)) || (N.isSchemaNode(x) && N.isSchemaNode(y))) {
		return validateTypeNode(x, y)
	} else if (N.isScalarNode(x) && N.isScalarNode(y)) {
		return validateScalarNode(x, y)
	} else if (N.isSumNode(x) && N.isSumNode(y)) {
		return validateSumNode(x, y);
	} else {
		return [tree(`cannot use node ${N.showNode.show(y)}, should be assignable to ${N.showNode.show(x)}`)]
	}
}

function validateTypeNode<
	SchemaNode extends N.TypeNode<string, any, any> | N.Schema<any>,
	RequestNode extends N.TypeNode<string, any, any> | N.Schema<any>
>(x: SchemaNode, y: RequestNode): Array<Tree<string>> {
	const xMembers = x.members
	const yMembers = y.members
	const errors: Array<Tree<string>> = []
	for (const k in yMembers) {
		const xk = xMembers[k]
		const yk = yMembers[k]
		if (xk === undefined) {
			errors.push(tree(`request has expected field ${k} that is unavailable on ${N.showTypeNode.show(xk)}`))
		} else {
			const mErrors = validateNode(xk, yk)
			if (isNonEmpty(mErrors)) {
				errors.push(tree(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}

function validateWrappedNode<SchemaNode extends N.WrappedNode<any>, RequestNode extends N.WrappedNode<any>>(
	x: SchemaNode,
	y: RequestNode
): Array<Tree<string>> {
	const errors = validateNode(x.wrapped, y.wrapped)
	if (isNonEmpty(errors)) {
		return [
			tree(
				`invalid request within ${x.tag}<${
					N.isMapNode(x) ? `${x.key.name || x.key.__typename || x.key.tag}, ` : ''
				}${x.wrapped.name || x.wrapped.__typename || x.tag}>`,
				errors
			)
		]
	} else {
		return [];
	}
}

function validateScalarNode<
	SchemaNode extends N.ScalarNode<string, any, N.VariablesNode>,
	RequestNode extends N.ScalarNode<string, any, N.VariablesNode>
>(x: SchemaNode, y: RequestNode): Array<Tree<string>> {
	const errors = []
	if (x.name !== y.name) {
		errors.push(tree(`scalar nodes are not the same, schema has ${x.name}, while request has ${y.name}`))
	}
	if (x.model !== y.model) {
		errors.push(tree(`Scalar Node: ${x.name} in the schema has a different model than Scalar Node:${y.name}`))
	}
	return errors
}

function validateSumNode<
	SchemaNode extends N.SumNode<any, any>,
	RequestNode extends N.SumNode<any, any>
	>(x: SchemaNode, y: RequestNode): Array<Tree<string>> {
	const xMembers = x.members
	const yMembers = y.members
	const errors: Array<Tree<string>> = []
	for (const k in yMembers) {
		const xk = xMembers[k]
		const yk = yMembers[k]
		if (xk === undefined) {
			errors.push(tree(`request has sum member ${k} that is unavailable in schema ${N.showTypeNode.show(xk)}`))
		} else {
			const mErrors = validateNode(xk, yk)
			if (isNonEmpty(mErrors)) {
				errors.push(tree(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}
