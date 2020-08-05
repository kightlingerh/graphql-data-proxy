import { isEmptyObject, isEmptyString } from '../shared/index'
import { Node, NodeVariablesDefinition, OptionNode, SchemaNode, TypeNode } from './Node'

const OPEN_BRACKET = '{'
const CLOSE_BRACKET = '}'
const OPEN_PAREN = '('
const CLOSE_PAREN = ')'
const COLON = ':'
const DOLLAR_SIGN = '$'
const EXCLAMATION = '!'
const ELLIPSIS = '...'
const OPEN_SPACE = ' '
const TYPENAME = '__typename'
const ON = 'on'

function printTypeNodeMembers(members: { [K: string]: Node }): string {
	const tokens: string[] = [OPEN_BRACKET, OPEN_SPACE]
	for (const [key, value] of Object.entries(members)) {
		if (!value?.__cache__?.isLocal) {
			tokens.push(key)
			if (!isEmptyObject(value.__variables_definition__)) {
				tokens.push(printVariables(value.__variables_definition__))
			}
			const val = printNode(value)
			tokens.push(...(isEmptyString(val) ? [OPEN_SPACE] : [OPEN_SPACE, val, OPEN_SPACE]))
		}
	}
	tokens.push(CLOSE_BRACKET)
	return tokens.join('')
}

function printVariables<V extends NodeVariablesDefinition>(variables: V, isRoot: boolean = false): string {
	const tokens: string[] = [OPEN_PAREN]
	const keys = Object.keys(variables)
	const length = keys.length
	const last = length - 1
	let i = 0
	for (; i < length; i++) {
		const key = keys[i]
		tokens.push(
			isRoot ? DOLLAR_SIGN : '',
			key,
			COLON,
			OPEN_SPACE,
			isRoot ? printVariableName(variables[key]) : `$${key}`,
			i === last ? '' : ', '
		)
	}
	tokens.push(CLOSE_PAREN)
	return tokens.join('')
}

function printVariableName(node: Node, isOptional: boolean = false): string {
	const optionalString = isOptional ? '' : EXCLAMATION
	switch (node.tag) {
		case 'Array':
		case 'NonEmptyArray':
			return `[${printVariableName(node.wrapped, isOptionNode(node.wrapped))}]${optionalString}`
		case 'Map':
			return `Map[${printVariableName(node.key)}, ${printVariableName(
				node.wrapped,
				isOptionNode(node.wrapped)
			)}]${optionalString}`
		case 'Option':
			return printVariableName(node.wrapped, true)
		case 'Boolean':
		case 'String':
		case 'Int':
		case 'Float':
			return `${node.tag}${optionalString}`
		case 'Scalar':
			return `${node.name}${optionalString}`
		case 'Type':
			return `${node.__typename}${optionalString}`
		default:
			return ''
	}
}

function isOptionNode(node: Node): node is OptionNode<any> {
	return node.tag === 'Option'
}

function printSumNodeMembers(members: ReadonlyArray<TypeNode<any, any, any, any, any, any, any>>): string {
	const tokens: string[] = [OPEN_BRACKET, OPEN_SPACE, TYPENAME]
	members.forEach((member) => {
		tokens.push(
			OPEN_SPACE,
			ELLIPSIS,
			ON,
			OPEN_SPACE,
			member.__typename,
			OPEN_SPACE,
			printTypeNodeMembers(member.members)
		)
	})
	tokens.push(CLOSE_BRACKET)
	return tokens.join('')
}

function printNode(node: Node): string {
	if (node?.__cache__?.isLocal) {
		return ''
	}
	switch (node.tag) {
		case 'String':
		case 'Boolean':
		case 'Scalar':
		case 'Int':
		case 'Float':
			return ''
		case 'Type':
			return printTypeNodeMembers(node.members)
		case 'Sum':
			return printSumNodeMembers(node.members)
		case 'Map':
		case 'Option':
		case 'NonEmptyArray':
		case 'Array':
			return printNode(node.wrapped)
		case 'Mutation':
			return printNode(node.result)
	}
}

export function print<N extends string, T extends { [K in keyof T]: Node }>(
	schema: SchemaNode<N, T>,
	operation: string,
	operationName: string
): string {
	const tokens = [operation, OPEN_SPACE, operationName]
	if (!isEmptyObject(schema.__sub_variables_definition__)) {
		tokens.push(printVariables(schema.__sub_variables_definition__, true))
	}
	tokens.push(OPEN_SPACE, printNode(schema))
	return tokens.join('')
}
