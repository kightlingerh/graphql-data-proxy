import { isNonEmpty } from 'fp-ts/lib/Array'
import { make, Tree } from 'fp-ts/lib/Tree'
import * as N from '../node'
import { showNode, showTypeNode } from '../node/show'
import { isMapNode, isScalarNode, isSumNode, isTypeNode, isWrappedNode, WrappedNode } from './shared'

const VALIDATIONS: WeakMap<N.SchemaNode<any, any>, WeakMap<N.SchemaNode<any, any>, Array<Tree<string>>>> = new WeakMap()

export function validate(schema: N.SchemaNode<any, any>, request: N.SchemaNode<any, any>, allowMutations = true) {
	const schemaValidations = VALIDATIONS.get(schema)
	if (schemaValidations) {
		const requestValidation = schemaValidations.get(request)
		if (requestValidation) {
			return requestValidation
		} else {
			const newValidation = validateTypeNode(schema as any, request as any, allowMutations)
			schemaValidations.set(request, newValidation)
			return newValidation
		}
	} else {
		const newValidations = validateTypeNode(schema as any, request as any, allowMutations)
		VALIDATIONS.set(schema, new WeakMap([[request, newValidations]]))
		return newValidations
	}
}

function validateNode(x: N.Node, y: N.Node, allowMutations: boolean): Array<Tree<string>> {
	const variableErrors = validateVariablesDefinition(x.variables, y.variables)
	if (!allowMutations && y.tag === 'Mutation') {
		return [...variableErrors, make(`cannot include mutations in a cache request`)]
	}
	if (isWrappedNode(x) && isWrappedNode(y)) {
		return [...variableErrors, ...validateWrappedNode(x, y, allowMutations)]
	} else if (isTypeNode(x) && isTypeNode(y)) {
		return [...variableErrors, ...validateTypeNode(x, y, allowMutations)]
	} else if (isScalarNode(x) && isScalarNode(y)) {
		return [...variableErrors, ...validateScalarNode(x, y)]
	} else if (isSumNode(x) && isSumNode(y)) {
		return [...variableErrors, ...validateSumNode(x, y, allowMutations)]
	} else if (x.tag === y.tag) {
		return variableErrors
	} else {
		return [
			...variableErrors,
			make(`cannot use node ${showNode.show(y)}, should be assignable to ${showNode.show(x)}`)
		]
	}
}

function validateVariablesDefinition(x: N.NodeVariables, y: N.NodeVariables): Array<Tree<string>> {
	const errors: Array<Tree<string>> = []
	for (const k in y) {
		const xk = x[k]
		const yk = y[k]
		if (xk === undefined) {
			errors.push(make(`request has expected variable ${k} that is unavailable on ${JSON.stringify(x)}`))
		} else {
			const mErrors = validateNode(xk as N.Node, yk as N.Node, false)
			if (isNonEmpty(mErrors)) {
				errors.push(make(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}

function validateTypeNode<
	SchemaNode extends N.TypeNode<any, any, any, any>,
	RequestNode extends N.TypeNode<any, any, any, any>
>(x: SchemaNode, y: RequestNode, allowMutations: boolean): Array<Tree<string>> {
	const xMembers = x.members
	const yMembers = y.members
	const errors: Array<Tree<string>> = []
	for (const k in yMembers) {
		const xk = xMembers[k]
		const yk = yMembers[k]
		if (xk === undefined) {
			errors.push(make(`request has expected field ${k} that is unavailable on ${showNode.show(x)}`))
		} else {
			const mErrors = validateNode(xk, yk, allowMutations)
			if (isNonEmpty(mErrors)) {
				errors.push(make(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}

function validateWrappedNode<SchemaNode extends WrappedNode, RequestNode extends WrappedNode>(
	x: SchemaNode,
	y: RequestNode,
	allowMutations: boolean
): Array<Tree<string>> {
	const errors = validateNode(x.item, y.item, allowMutations)
	if (isNonEmpty(errors)) {
		return [
			make(
				`invalid request within ${x.tag}<${
					isMapNode(x) ? `${x.key.name || x.key.__typename || x.key.tag}, ` : ''
				}${x.item.name || x.item.__typename || x.item.tag}>`,
				errors
			)
		]
	} else {
		return []
	}
}

function validateScalarNode<
	SchemaNode extends N.ScalarNode<any, any, any, any, any, any>,
	RequestNode extends N.ScalarNode<any, any, any, any, any, any>
>(x: SchemaNode, y: RequestNode): Array<Tree<string>> {
	const errors = []
	if (x.name !== y.name) {
		errors.push(make(`scalar nodes are not the same, schema has ${x.name}, while request has ${y.name}`))
	}
	if (x.strict !== y.strict) {
		errors.push(make(`Scalar Node: ${x.name} in the schema has a different model than Scalar Node:${y.name}`))
	}
	return errors
}

function validateSumNode<SchemaNode extends N.SumNode<any, any, any>, RequestNode extends N.SumNode<any, any, any>>(
	x: SchemaNode,
	y: RequestNode,
	allowMutations: boolean
): Array<Tree<string>> {
	const xMembers = x.membersRecord as Record<string, N.Node>
	const yMembers = y.membersRecord as Record<string, N.Node>
	const errors: Array<Tree<string>> = []
	for (const k in yMembers) {
		const xk = xMembers[k]
		const yk = yMembers[k]
		if (xk === undefined) {
			errors.push(make(`request has sum member ${k} that is unavailable in schema ${showTypeNode.show(xk)}`))
		} else {
			const mErrors = validateNode(xk, yk, allowMutations)
			if (isNonEmpty(mErrors)) {
				errors.push(make(`invalid request on ${k}`, mErrors))
			}
		}
	}
	return errors
}
