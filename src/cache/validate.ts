import { isNonEmpty } from 'fp-ts/lib/Array'
import { Tree } from 'fp-ts/lib/Tree'
import { tree } from 'io-ts/lib/Decoder'
import * as D from '../document/DocumentNode'

export function validate<S extends D.TypeNode<string, any>>(schema: S) {
	const validations: Map<D.TypeNode<string, any>, Array<Tree<string>>> = new Map()
	return <R extends D.TypeNode<string, any>>(request: R): Array<Tree<string>> => {
		const validation = validations.get(request)
		if (validation) {
			return validation
		} else {
			const newValidation = validateTypeNode(schema, request)
			validations.set(request, newValidation)
			return newValidation
		}
	}
}

function validateNode(x: D.Node, y: D.Node): Array<Tree<string>> {
	if (D.isWrappedNode(x) && D.isWrappedNode(y)) {
		return validateWrappedNode(x.wrapped, y.wrapped)
	} else if (D.isTypeNode(x) && D.isTypeNode(y)) {
		return validateTypeNode(x, y)
	} else if (D.isScalarNode(x) && D.isScalarNode(y)) {
		return validateScalarNode(x, y)
	} else if (D.isSumNode(x) && D.isSumNode(y)) {
		return validateSumNode(x, y)
	} else {
		return [tree(`cannot use node ${D.showNode.show(y)}, should be assignable to ${D.showNode.show(x)}`)]
	}
}

function validateTypeNode<SchemaNode extends D.TypeNode<any, any, any>, RequestNode extends D.TypeNode<any, any, any>>(
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
			errors.push(tree(`request has expected field ${k} that is unavailable on ${D.showTypeNode.show(xk)}`))
		} else {
			const mErrors = validateNode(xk, yk)
			if (isNonEmpty(mErrors)) {
				errors.push(tree(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}

function validateWrappedNode<SchemaNode extends D.WrappedNode<any>, RequestNode extends D.WrappedNode<any>>(
	x: SchemaNode,
	y: RequestNode
): Array<Tree<string>> {
	const errors = validateNode(x.wrapped, y.wrapped)
	if (isNonEmpty(errors)) {
		return [
			tree(
				`invalid request within ${x.tag}<${
					D.isMapNode(x) ? `${x.key.name || x.key.__typename || x.key.tag}, ` : ''
				}${x.wrapped.name || x.wrapped.__typename || x.tag}>`,
				errors
			)
		]
	} else {
		return []
	}
}

function validateScalarNode<
	SchemaNode extends D.ScalarNode<string, any, D.VariablesNode>,
	RequestNode extends D.ScalarNode<string, any, D.VariablesNode>
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

function validateSumNode<SchemaNode extends D.SumNode<any, any>, RequestNode extends D.SumNode<any, any>>(
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
			errors.push(tree(`request has sum member ${k} that is unavailable in schema ${D.showTypeNode.show(xk)}`))
		} else {
			const mErrors = validateNode(xk, yk)
			if (isNonEmpty(mErrors)) {
				errors.push(tree(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}
