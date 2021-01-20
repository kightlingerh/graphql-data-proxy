import { isEmptyObject } from '../shared/index'
import { MapNode } from './Map'
import { Node, useMergedVariables } from './Node_'
import { OptionNode } from './Option'
import { SchemaNode } from './Schema'
import { NodeVariables } from './shared'
import { TypeNode } from './Type'

const OPEN_BRACE = '{'
const CLOSE_BRACE = '}'
const OPEN_BRACKET = '['
const CLOSE_BRACKET = ']'
const OPEN_PAREN = '('
const CLOSE_PAREN = ')'
const COLON = ':'
const DOLLAR_SIGN = '$'
const EXCLAMATION = '!'
const ELLIPSIS = '...'
const OPEN_SPACE = ' '
const TYPENAME = '__typename'
const ON = 'on'
const MAP = 'Map'

function printTypeNodeMembers(mapPrinter: MapPrinter, members: Record<string, Node>, tokens: string[]) {
	tokens.push(OPEN_BRACE, OPEN_SPACE)
	for (const [key, value] of Object.entries(members)) {
		if (!value?.__isLocal) {
			tokens.push(key)
			if (!isEmptyObject(value.variables)) {
				printVariables(mapPrinter, value.variables, tokens)
			}
			tokens.push(OPEN_SPACE)
			printNode(mapPrinter, value, tokens)
			tokens.push(OPEN_SPACE)
		}
	}
	tokens.push(CLOSE_BRACE)
	return tokens
}

function printVariables<V extends NodeVariables>(
	mapPrinter: MapPrinter,
	variables: V,
	tokens: string[],
	isRoot: boolean = false
) {
	tokens.push(OPEN_PAREN)
	const keys = Object.keys(variables)
	const length = keys.length
	const last = length - 1
	let i = 0
	for (; i < length; i++) {
		const key = keys[i]
		tokens.push(isRoot ? DOLLAR_SIGN : '', key, COLON, OPEN_SPACE)
		if (isRoot) {
			printVariableName(mapPrinter, variables[key] as Node, tokens)
		} else {
			tokens.push(DOLLAR_SIGN, key)
		}
		if (i === last) {
			tokens.push(', ')
		}
	}
	tokens.push(CLOSE_PAREN)
}

function printVariableName(mapPrinter: MapPrinter, node: Node, tokens: string[], isOptional: boolean = false) {
	const optionalString = isOptional ? '' : EXCLAMATION
	switch (node.tag) {
		case 'Array':
		case 'NonEmptyArray':
			tokens.push(OPEN_BRACKET)
			printVariableName(mapPrinter, node.item, tokens, isOptionNode(node.item)),
				tokens.push(CLOSE_BRACKET, optionalString)
			break
		case 'Map':
			const keyTokens: string[] = []
			printVariableName(mapPrinter, node.key, keyTokens)
			const valueTokens: string[] = []
			printVariableName(mapPrinter, node.item, valueTokens, isOptionNode(node.item))
			tokens.push(...mapPrinter.tokenizeMapVariables(node, keyTokens, valueTokens), optionalString)
			break
		case 'Option':
			printVariableName(mapPrinter, node.item, tokens, true)
			break
		case 'Boolean':
		case 'String':
		case 'Int':
		case 'Float':
			tokens.push(node.tag, optionalString)
			break
		case 'Scalar':
			tokens.push(node.name, optionalString)
			break
		case 'Type':
			tokens.push(node.__typename, optionalString)
			break
	}
}

function isOptionNode(node: Node): node is OptionNode<any, any, any> {
	return node.tag === 'Option'
}

function printSumNodeMembers(
	mapPrinter: MapPrinter,
	members: ReadonlyArray<TypeNode<any, any, any, any>>,
	tokens: string[]
) {
	tokens.push(OPEN_BRACE, OPEN_SPACE, TYPENAME)
	members.forEach((member) => {
		tokens.push(OPEN_SPACE, ELLIPSIS, ON, OPEN_SPACE, member.__typename, OPEN_SPACE)
		printTypeNodeMembers(mapPrinter, member.members, tokens)
	})
	tokens.push(CLOSE_BRACE)
}

function printMapNode(mapPrinter: MapPrinter, node: MapNode<any, any, any, any, any, any, any, any>, tokens: string[]) {
	const keyTokens: string[] = []
	printNode(mapPrinter, node.key, keyTokens)
	const valueTokens: string[] = []
	printNode(mapPrinter, node.item, valueTokens)
	tokens.push(...mapPrinter.tokenizeMapRequest(node, keyTokens, valueTokens))
}

function printNode(mapPrinter: MapPrinter, node: Node, tokens: string[]) {
	if (node?.__isLocal) {
		return
	}
	switch (node.tag) {
		case 'Type':
			printTypeNodeMembers(mapPrinter, node.members, tokens)
			break
		case 'Sum':
			printSumNodeMembers(mapPrinter, node.members, tokens)
			break
		case 'Map':
			printMapNode(mapPrinter, node, tokens)
			break
		case 'Option':
		case 'NonEmptyArray':
		case 'Array':
			printNode(mapPrinter, node.item, tokens)
			break
		case 'Mutation':
			printNode(mapPrinter, node.result, tokens)
	}
}

function print(mapPrinter: MapPrinter, schema: SchemaNode<any, any>, operation: string, operationName: string): string {
	const tokens = [operation, OPEN_SPACE, operationName]
	const mergedVariables = useMergedVariables(schema)
	if (!isEmptyObject(mergedVariables)) {
		printVariables(mapPrinter, mergedVariables, tokens, true)
	}
	tokens.push(OPEN_SPACE)
	printNode(mapPrinter, schema, tokens)
	return tokens.join('')
}

export interface MapPrinter {
	tokenizeMapVariables: (
		node: MapNode<any, any, any, any, any, any, any, any>,
		keyTokens: string[],
		valueTokens: string[]
	) => string[]
	tokenizeMapRequest: (
		node: MapNode<any, any, any, any, any, any, any, any>,
		keyTokens: string[],
		valueTokens: string[]
	) => string[]
}

const DEFAULT_MAP_PRINTER: MapPrinter = {
	tokenizeMapVariables: (_, keyTokens, valueTokens) => {
		return [MAP, OPEN_BRACE, ...keyTokens, OPEN_SPACE, ...valueTokens, CLOSE_BRACE]
	},
	tokenizeMapRequest: (_, tokens) => tokens
}

export function definePrinter(mapPrinter: Partial<MapPrinter>) {
	return (schema: SchemaNode<any, any>, operation: string, operationName: string): string => {
		return print({ ...DEFAULT_MAP_PRINTER, ...mapPrinter }, schema, operation, operationName)
	}
}
