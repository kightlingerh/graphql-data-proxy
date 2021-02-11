import { isEmptyObject, isEmptyString } from '../shared/index'
import { Node } from './Node'
import { OptionNode } from './Option'
import { SchemaNode } from './Schema'
import { NodeVariables } from './shared'
import { TypeNode } from './Type'
import { useNodeMergedVariables } from './Variables'

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
		if (!value?.__isLocal) {
			tokens.push(key)
			if (!isEmptyObject(value.variables)) {
				tokens.push(printVariables(value.variables))
			}
			const val = printNode(value)
			tokens.push(...(isEmptyString(val) ? [OPEN_SPACE] : [OPEN_SPACE, val, OPEN_SPACE]))
		}
	}
	tokens.push(CLOSE_BRACKET)
	return tokens.join('')
}

function printVariables<V extends NodeVariables>(variables: V, isRoot: boolean = false): string {
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
			isRoot ? printVariableName(variables[key] as Node) : `$${key}`,
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
			return `[${printVariableName(node.item, isOptionNode(node.item))}]${optionalString}`
		case 'Map':
			return `[${node.__typename}]${optionalString}`
		case 'Option':
			return printVariableName(node.item, true)
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

function printSumNodeMembers(members: ReadonlyArray<TypeNode<any, any>>): string {
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
	if (node?.__isLocal) {
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
			return printTypeNodeMembers({
				key: node.key,
				value: node.item
			})
		case 'Option':
		case 'NonEmptyArray':
		case 'Array':
			return printNode(node.item)
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
	const mergedVariables = useNodeMergedVariables(schema)
	if (!isEmptyObject(mergedVariables)) {
		tokens.push(printVariables(mergedVariables, true))
	}
	tokens.push(OPEN_SPACE, printNode(schema))
	return tokens.join('')
}
