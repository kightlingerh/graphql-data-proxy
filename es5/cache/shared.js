"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSumNode = exports.isScalarNode = exports.isTypeNode = exports.isEntityNode = exports.isWrappedNode = exports.isMapNode = exports.isNoneEmptyArrayNode = exports.isOptionNode = exports.isArrayNode = void 0;
function isArrayNode(node) {
    return node.tag === 'Array';
}
exports.isArrayNode = isArrayNode;
function isOptionNode(node) {
    return node.tag === 'Option';
}
exports.isOptionNode = isOptionNode;
function isNoneEmptyArrayNode(node) {
    return node.tag === 'NonEmptyArray';
}
exports.isNoneEmptyArrayNode = isNoneEmptyArrayNode;
function isMapNode(node) {
    return node.tag === 'Map';
}
exports.isMapNode = isMapNode;
function isWrappedNode(node) {
    switch (node.tag) {
        case 'Option':
        case 'NonEmptyArray':
        case 'Map':
        case 'Array':
            return true;
        default:
            return false;
    }
}
exports.isWrappedNode = isWrappedNode;
function isEntityNode(node) {
    var _a;
    switch (node.tag) {
        case 'Int':
        case 'Boolean':
        case 'String':
        case 'Scalar':
        case 'Float':
            return true;
        default:
            return !!((_a = node === null || node === void 0 ? void 0 : node.__cache__) === null || _a === void 0 ? void 0 : _a.isEntity);
    }
}
exports.isEntityNode = isEntityNode;
function isTypeNode(node) {
    return node.tag === 'Type';
}
exports.isTypeNode = isTypeNode;
function isScalarNode(node) {
    return node.tag === 'Scalar';
}
exports.isScalarNode = isScalarNode;
function isSumNode(node) {
    return node.tag === 'Sum';
}
exports.isSumNode = isSumNode;
