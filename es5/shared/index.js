"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableValidation = exports.isDev = exports.isEmptyString = exports.isEmptyObject = void 0;
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}
exports.isEmptyObject = isEmptyObject;
function isEmptyString(x) {
    return x === '';
}
exports.isEmptyString = isEmptyString;
exports.isDev = ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.NODE_ENV) !== 'production';
exports.disableValidation = ((_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b.DISABLE_VALIDATION) !== undefined;
