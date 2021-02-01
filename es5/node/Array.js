"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markArrayAsEntity = exports.array = void 0;
const model_1 = require("../model");
const shared_1 = require("./shared");
const ARRAY_TAG = 'Array';
function useArrayModel(item, isLocal, isStrict) {
    return shared_1.useAdjustedModel(model_1.fromArray(isStrict ? item.strict : item.partial), isLocal, !item.__hasTransformations.encoding, !item.__hasTransformations.decoding);
}
function array(item, config) {
    var _a;
    return {
        tag: ARRAY_TAG,
        item,
        strict: useArrayModel(item, !!(config === null || config === void 0 ? void 0 : config.isLocal), true),
        partial: useArrayModel(item, !!(config === null || config === void 0 ? void 0 : config.isLocal), false),
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: item.__hasTransformations,
        __isEntity: config === null || config === void 0 ? void 0 : config.isEntity,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.array = array;
function markArrayAsEntity(node) {
    return Object.assign(Object.assign({}, node), { __isEntity: true });
}
exports.markArrayAsEntity = markArrayAsEntity;
