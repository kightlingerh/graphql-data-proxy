"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.definePrinter = void 0;
const index_1 = require("../shared/index");
const Node_1 = require("./Node");
const OPEN_BRACE = '{';
const CLOSE_BRACE = '}';
const OPEN_BRACKET = '[';
const CLOSE_BRACKET = ']';
const OPEN_PAREN = '(';
const CLOSE_PAREN = ')';
const COLON = ':';
const DOLLAR_SIGN = '$';
const EXCLAMATION = '!';
const ELLIPSIS = '...';
const OPEN_SPACE = ' ';
const TYPENAME = '__typename';
const ON = 'on';
const MAP = 'Map';
function printTypeNodeMembers(mapPrinter, members, tokens) {
    tokens.push(OPEN_BRACE, OPEN_SPACE);
    for (const [key, value] of Object.entries(members)) {
        if (!(value === null || value === void 0 ? void 0 : value.__isLocal)) {
            tokens.push(key);
            if (!index_1.isEmptyObject(value.variables)) {
                printVariables(mapPrinter, value.variables, tokens);
            }
            tokens.push(OPEN_SPACE);
            printNode(mapPrinter, value, tokens);
            tokens.push(OPEN_SPACE);
        }
    }
    tokens.push(CLOSE_BRACE);
    return tokens;
}
function printVariables(mapPrinter, variables, tokens, isRoot = false) {
    tokens.push(OPEN_PAREN);
    const keys = Object.keys(variables);
    const length = keys.length;
    const last = length - 1;
    let i = 0;
    for (; i < length; i++) {
        const key = keys[i];
        tokens.push(isRoot ? DOLLAR_SIGN : '', key, COLON, OPEN_SPACE);
        if (isRoot) {
            printVariableName(mapPrinter, variables[key], tokens);
        }
        else {
            tokens.push(DOLLAR_SIGN, key);
        }
        if (i === last) {
            tokens.push(', ');
        }
    }
    tokens.push(CLOSE_PAREN);
}
function printVariableName(mapPrinter, node, tokens, isOptional = false) {
    const optionalString = isOptional ? '' : EXCLAMATION;
    switch (node.tag) {
        case 'Array':
        case 'NonEmptyArray':
            tokens.push(OPEN_BRACKET);
            printVariableName(mapPrinter, node.item, tokens, isOptionNode(node.item)),
                tokens.push(CLOSE_BRACKET, optionalString);
            break;
        case 'Map':
            const keyTokens = [];
            printVariableName(mapPrinter, node.key, keyTokens);
            const valueTokens = [];
            printVariableName(mapPrinter, node.item, valueTokens, isOptionNode(node.item));
            tokens.push(...mapPrinter.tokenizeMapVariables(node, keyTokens, valueTokens), optionalString);
            break;
        case 'Option':
            printVariableName(mapPrinter, node.item, tokens, true);
            break;
        case 'Boolean':
        case 'String':
        case 'Int':
        case 'Float':
            tokens.push(node.tag, optionalString);
            break;
        case 'Scalar':
            tokens.push(node.name, optionalString);
            break;
        case 'Type':
            tokens.push(node.__typename, optionalString);
            break;
    }
}
function isOptionNode(node) {
    return node.tag === 'Option';
}
function printSumNodeMembers(mapPrinter, members, tokens) {
    tokens.push(OPEN_BRACE, OPEN_SPACE, TYPENAME);
    members.forEach((member) => {
        tokens.push(OPEN_SPACE, ELLIPSIS, ON, OPEN_SPACE, member.__typename, OPEN_SPACE);
        printTypeNodeMembers(mapPrinter, member.members, tokens);
    });
    tokens.push(CLOSE_BRACE);
}
function printMapNode(mapPrinter, node, tokens) {
    const keyTokens = [];
    printNode(mapPrinter, node.key, keyTokens);
    const valueTokens = [];
    printNode(mapPrinter, node.item, valueTokens);
    tokens.push(...mapPrinter.tokenizeMapRequest(node, keyTokens, valueTokens));
}
function printNode(mapPrinter, node, tokens) {
    if (node === null || node === void 0 ? void 0 : node.__isLocal) {
        return;
    }
    switch (node.tag) {
        case 'Type':
            printTypeNodeMembers(mapPrinter, node.members, tokens);
            break;
        case 'Sum':
            printSumNodeMembers(mapPrinter, node.members, tokens);
            break;
        case 'Map':
            printMapNode(mapPrinter, node, tokens);
            break;
        case 'Option':
        case 'NonEmptyArray':
        case 'Array':
            printNode(mapPrinter, node.item, tokens);
            break;
        case 'Mutation':
            printNode(mapPrinter, node.result, tokens);
    }
}
function print(mapPrinter, schema, operation, operationName) {
    const tokens = [operation, OPEN_SPACE, operationName];
    const mergedVariables = Node_1.useMergedVariables(schema);
    if (!index_1.isEmptyObject(mergedVariables)) {
        printVariables(mapPrinter, mergedVariables, tokens, true);
    }
    tokens.push(OPEN_SPACE);
    printNode(mapPrinter, schema, tokens);
    return tokens.join('');
}
const DEFAULT_MAP_PRINTER = {
    tokenizeMapVariables: (_, keyTokens, valueTokens) => {
        return [MAP, OPEN_BRACE, ...keyTokens, OPEN_SPACE, ...valueTokens, CLOSE_BRACE];
    },
    tokenizeMapRequest: (_, tokens) => tokens
};
function definePrinter(mapPrinter = {}) {
    return (schema, operation, operationName) => {
        return print(Object.assign(Object.assign({}, DEFAULT_MAP_PRINTER), mapPrinter), schema, operation, operationName);
    };
}
exports.definePrinter = definePrinter;
