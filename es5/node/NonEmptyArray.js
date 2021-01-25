"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nonEmptyArray = void 0;
const M = __importStar(require("../model/Model"));
const shared_1 = require("./shared");
const NON_EMPTY_ARRAY_TAG = 'NonEmptyArray';
function getNonEmptyArrayModel(item, isLocal, isStrict) {
    return shared_1.useAdjustedModel(M.fromNonEmptyArray(isStrict ? item.strict : item.partial), isLocal, false, false);
}
function nonEmptyArray(item, config) {
    var _a;
    return {
        tag: NON_EMPTY_ARRAY_TAG,
        item,
        strict: getNonEmptyArrayModel(item, !!(config === null || config === void 0 ? void 0 : config.isLocal), true),
        partial: getNonEmptyArrayModel(item, !!(config === null || config === void 0 ? void 0 : config.isLocal), false),
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: shared_1.HAS_TRANSFORMATIONS,
        __isEntity: config === null || config === void 0 ? void 0 : config.isEntity,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.nonEmptyArray = nonEmptyArray;
