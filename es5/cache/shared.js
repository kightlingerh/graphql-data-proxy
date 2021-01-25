"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseMap = exports.traverseMapWithKey = exports.isWrappedNode = exports.isNonPrimitiveEntityNode = exports.isPrimitiveNode = exports.isSumNode = exports.isScalarNode = exports.isTypeNode = exports.isMapNode = exports.isNonEmptyArrayNode = exports.isOptionNode = exports.isArrayNode = exports.isMap = void 0;
function isMap(val) {
    return Object.prototype.toString.call(val) === '[object Map]';
}
exports.isMap = isMap;
function isArrayNode(node) {
    return node.tag === 'Array';
}
exports.isArrayNode = isArrayNode;
function isOptionNode(node) {
    return node.tag === 'Option';
}
exports.isOptionNode = isOptionNode;
function isNonEmptyArrayNode(node) {
    return node.tag === 'NonEmptyArray';
}
exports.isNonEmptyArrayNode = isNonEmptyArrayNode;
function isMapNode(node) {
    return node.tag === 'Map';
}
exports.isMapNode = isMapNode;
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
const PrimitiveTags = new Set(['Boolean', 'Float', 'Int', 'String', 'Scalar']);
function isPrimitiveNode(node) {
    return PrimitiveTags.has(node.tag);
}
exports.isPrimitiveNode = isPrimitiveNode;
function isNonPrimitiveEntityNode(node) {
    return !PrimitiveTags.has(node.tag) && !!(node === null || node === void 0 ? void 0 : node.__isEntity);
}
exports.isNonPrimitiveEntityNode = isNonPrimitiveEntityNode;
const WrappedNodeTags = new Set(['Array', 'Map', 'NonEmptyArray', 'Option']);
function isWrappedNode(node) {
    return WrappedNodeTags.has(node.tag);
}
exports.isWrappedNode = isWrappedNode;
function traverseMapWithKey(f) {
    return (map) => {
        const newMap = new Map();
        for (const [key, value] of map.entries()) {
            newMap.set(key, f(key, value));
        }
        return newMap;
    };
}
exports.traverseMapWithKey = traverseMapWithKey;
const traverseMap = (f) => traverseMapWithKey((_, a) => f(a));
exports.traverseMap = traverseMap;
