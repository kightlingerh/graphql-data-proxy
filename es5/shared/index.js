"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmptyString = exports.isEmptyObject = void 0;
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}
exports.isEmptyObject = isEmptyObject;
function isEmptyString(x) {
    return x === '';
}
exports.isEmptyString = isEmptyString;
