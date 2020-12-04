"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = void 0;
const index_1 = require("../shared/index");
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
    var _a;
    const tokens = [OPEN_BRACKET, OPEN_SPACE];
    for (const [key, value] of Object.entries(members)) {
        if (!((_a = value === null || value === void 0 ? void 0 : value.__cache__) === null || _a === void 0 ? void 0 : _a.isLocal)) {
            tokens.push(key);
            if (!index_1.isEmptyObject(value.__variables_definition__)) {
                tokens.push(printVariables(value.__variables_definition__));
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
            return `[${printVariableName(node.wrapped, isOptionNode(node.wrapped))}]${optionalString}`;
        case 'Map':
            return `Map[${printVariableName(node.key)}, ${printVariableName(node.wrapped, isOptionNode(node.wrapped))}]${optionalString}`;
        case 'Option':
            return printVariableName(node.wrapped, true);
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
    var _a;
    if ((_a = node === null || node === void 0 ? void 0 : node.__cache__) === null || _a === void 0 ? void 0 : _a.isLocal) {
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
            return printNode(node.wrapped);
        case 'Mutation':
            return printNode(node.result);
    }
}
function print(schema, operation, operationName) {
    const tokens = [operation, OPEN_SPACE, operationName];
    if (!index_1.isEmptyObject(schema.__sub_variables_definition__)) {
        tokens.push(printVariables(schema.__sub_variables_definition__, true));
    }
    tokens.push(OPEN_SPACE, printNode(schema));
    return tokens.join('');
}
exports.print = print;
