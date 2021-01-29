"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = void 0;
const index_1 = require("../shared/index");
const Node_1 = require("./Node");
const OPEN_BRACKET = '{';
const CLOSE_BRACKET = '}';
const OPEN_PAREN = '(';
const CLOSE_PAREN = ')';
const COLON = ':';
const DOLLAR_SIGN = '$';
const EXCLAMATION = '!';
const ELLIPSIS = '...';
const OPEN_SPACE = ' ';
const TYPENAME = '__typename';
const ON = 'on';
function printTypeNodeMembers(members) {
    const tokens = [OPEN_BRACKET, OPEN_SPACE];
    for (const [key, value] of Object.entries(members)) {
        if (!(value === null || value === void 0 ? void 0 : value.__isLocal)) {
            tokens.push(key);
            if (!index_1.isEmptyObject(value.variables)) {
                tokens.push(printVariables(value.variables));
            }
            const val = printNode(value);
            tokens.push(...(index_1.isEmptyString(val) ? [OPEN_SPACE] : [OPEN_SPACE, val, OPEN_SPACE]));
        }
    }
    tokens.push(CLOSE_BRACKET);
    return tokens.join('');
}
function printVariables(variables, isRoot = false) {
    const tokens = [OPEN_PAREN];
    const keys = Object.keys(variables);
    const length = keys.length;
    const last = length - 1;
    let i = 0;
    for (; i < length; i++) {
        const key = keys[i];
        tokens.push(isRoot ? DOLLAR_SIGN : '', key, COLON, OPEN_SPACE, isRoot ? printVariableName(variables[key]) : `$${key}`, i === last ? '' : ', ');
    }
    tokens.push(CLOSE_PAREN);
    return tokens.join('');
}
function printVariableName(node, isOptional = false) {
    const optionalString = isOptional ? '' : EXCLAMATION;
    switch (node.tag) {
        case 'Array':
        case 'NonEmptyArray':
            return `[${printVariableName(node.item, isOptionNode(node.item))}]${optionalString}`;
        case 'Map':
            return `Map[${printVariableName(node.key)}, ${printVariableName(node.item, isOptionNode(node.item))}]${optionalString}`;
        case 'Option':
            return printVariableName(node.item, true);
        case 'Boolean':
        case 'String':
        case 'Int':
        case 'Float':
            return `${node.tag}${optionalString}`;
        case 'Scalar':
            return `${node.name}${optionalString}`;
        case 'Type':
            return `${node.__typename}${optionalString}`;
        default:
            return '';
    }
}
function isOptionNode(node) {
    return node.tag === 'Option';
}
function printSumNodeMembers(members) {
    const tokens = [OPEN_BRACKET, OPEN_SPACE, TYPENAME];
    members.forEach((member) => {
        tokens.push(OPEN_SPACE, ELLIPSIS, ON, OPEN_SPACE, member.__typename, OPEN_SPACE, printTypeNodeMembers(member.members));
    });
    tokens.push(CLOSE_BRACKET);
    return tokens.join('');
}
function printNode(node) {
    if (node === null || node === void 0 ? void 0 : node.__isLocal) {
        return '';
    }
    switch (node.tag) {
        case 'String':
        case 'Boolean':
        case 'Scalar':
        case 'Int':
        case 'Float':
            return '';
        case 'Type':
            return printTypeNodeMembers(node.members);
        case 'Sum':
            return printSumNodeMembers(node.members);
        case 'Map':
        case 'Option':
        case 'NonEmptyArray':
        case 'Array':
            return printNode(node.item);
        case 'Mutation':
            return printNode(node.result);
    }
}
function print(schema, operation, operationName) {
    const tokens = [operation, OPEN_SPACE, operationName];
    const mergedVariables = Node_1.useMergedVariables(schema);
    if (!index_1.isEmptyObject(mergedVariables)) {
        tokens.push(printVariables(mergedVariables, true));
    }
    tokens.push(OPEN_SPACE, printNode(schema));
    return tokens.join('');
}
exports.print = print;
