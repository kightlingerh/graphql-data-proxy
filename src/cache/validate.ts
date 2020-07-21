import { isNonEmpty } from 'fp-ts/lib/Array'
import { Tree } from 'fp-ts/lib/Tree'
import { tree } from 'io-ts/lib/Decoder'
import * as N from '../node'
import { showNode, showTypeNode } from '../node/show'
import { isMapNode, isScalarNode, isSumNode, isTypeNode, isWrappedNode } from './shared'

const VALIDATIONS: WeakMap<N.SchemaNode<any, any>, WeakMap<N.SchemaNode<any, any>, Array<Tree<string>>>> = new WeakMap()

export function validate(schema: N.SchemaNode<any, any>, request: N.SchemaNode<any, any>) {
	const schemaValidations = VALIDATIONS.get(schema)
	if (schemaValidations) {
		const requestValidation = schemaValidations.get(request)
		if (requestValidation) {
			return requestValidation
		} else {
			const newValidation = validateTypeNode(schema as any, request as any)
			schemaValidations.set(request, newValidation)
			return newValidation
		}
	} else {
		const newValidations = validateTypeNode(schema as any, request as any)
		VALIDATIONS.set(schema, new WeakMap([[request, newValidations]]))
		return newValidations
	}
}

function validateNode(x: N.Node, y: N.Node): Array<Tree<string>> {
	if (isWrappedNode(x) && isWrappedNode(y)) {
		return validateWrappedNode(x, y)
	} else if (isTypeNode(x) && isTypeNode(y)) {
		return validateTypeNode(x, y)
	} else if (isScalarNode(x) && isScalarNode(y)) {
		return validateScalarNode(x, y)
	} else if (isSumNode(x) && isSumNode(y)) {
		return validateSumNode(x, y)
	} else if (x.tag === y.tag) {
		return []
	} else {
		return [tree(`cannot use node ${showNode.show(y)}, should be assignable to ${showNode.show(x)}`)]
	}
}

function validateTypeNode<SchemaNode extends N.TypeNode<any, any, any>, RequestNode extends N.TypeNode<any, any, any>>(
	x: SchemaNode,
	y: RequestNode
): Array<Tree<string>> {
	const xMembers = x.members
	const yMembers = y.members
	const errors: Array<Tree<string>> = []
	for (const k in yMembers) {
		const xk = xMembers[k]
		const yk = yMembers[k]
		if (xk === undefined) {
			errors.push(tree(`request has expected field ${k} that is unavailable on ${showNode.show(x)}`))
		} else {
			const mErrors = validateNode(xk, yk)
			if (isNonEmpty(mErrors)) {
				errors.push(tree(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}

function validateWrappedNode<SchemaNode extends N.WrappedNode, RequestNode extends N.WrappedNode>(
	x: SchemaNode,
	y: RequestNode
): Array<Tree<string>> {
	const errors = validateNode(x.wrapped, y.wrapped)
	if (isNonEmpty(errors)) {
		return [
			tree(
				`invalid request within ${x.tag}<${
					isMapNode(x) ? `${x.key.name || x.key.__typename || x.key.tag}, ` : ''
				}${x.wrapped.name || x.wrapped.__typename || x.wrapped.tag}>`,
				errors
			)
		]
	} else {
		return []
	}
}

function validateScalarNode<
	SchemaNode extends N.ScalarNode<string, any, N.NodeVariablesDefinition>,
	RequestNode extends N.ScalarNode<string, any, N.NodeVariablesDefinition>
>(x: SchemaNode, y: RequestNode): Array<Tree<string>> {
	const errors = []
	if (x.name !== y.name) {
		errors.push(tree(`scalar nodes are not the same, schema has ${x.name}, while request has ${y.name}`))
	}
	if (x.strictModel !== y.strictModel) {
		errors.push(tree(`Scalar Node: ${x.name} in the schema has a different model than Scalar Node:${y.name}`))
	}
	return errors
}

function validateSumNode<SchemaNode extends N.SumNode<any, any>, RequestNode extends N.SumNode<any, any>>(
	x: SchemaNode,
	y: RequestNode
): Array<Tree<string>> {
	const xMembers = x.membersRecord
	const yMembers = y.membersRecord
	const errors: Array<Tree<string>> = []
	for (const k in yMembers) {
		const xk = xMembers[k]
		const yk = yMembers[k]
		if (xk === undefined) {
			errors.push(tree(`request has sum member ${k} that is unavailable in schema ${showTypeNode.show(xk)}`))
		} else {
			const mErrors = validateNode(xk, yk)
			if (isNonEmpty(mErrors)) {
				errors.push(tree(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}
