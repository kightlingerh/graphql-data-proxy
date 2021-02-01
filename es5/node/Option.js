"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markOptionAsEntity = exports.option = void 0;
const Model_1 = require("../model/Model");
const shared_1 = require("./shared");
const OPTION_TAG = 'Option';
function useOptionModel(item, isLocal, isStrict) {
    return shared_1.useAdjustedModel(Model_1.fromOption(isStrict ? item.strict : item.partial), isLocal, false, false);
}
function option(item, config) {
    var _a;
    return {
        tag: OPTION_TAG,
        item,
        strict: useOptionModel(item, !!(config === null || config === void 0 ? void 0 : config.isLocal), true),
        partial: useOptionModel(item, !!(config === null || config === void 0 ? void 0 : config.isLocal), false),
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: shared_1.HAS_TRANSFORMATIONS,
        __isEntity: config === null || config === void 0 ? void 0 : config.isEntity,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.option = option;
function markOptionAsEntity(node) {
    return Object.assign(Object.assign({}, node), { __isEntity: true });
}
exports.markOptionAsEntity = markOptionAsEntity;
