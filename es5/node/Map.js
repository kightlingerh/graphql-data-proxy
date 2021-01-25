"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = void 0;
const model_1 = require("../model");
const shared_1 = require("./shared");
const MAP_TAG = 'Map';
function map(key, item, config) {
    var _a;
    return {
        tag: MAP_TAG,
        item,
        key,
        strict: model_1.fromMap(key.strict, item.strict),
        partial: model_1.fromMap(key.partial, item.partial),
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        name: config === null || config === void 0 ? void 0 : config.name,
        __hasTransformations: shared_1.HAS_TRANSFORMATIONS,
        __customCache: config === null || config === void 0 ? void 0 : config.useCustomCache,
        __isEntity: config === null || config === void 0 ? void 0 : config.isEntity,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.map = map;
