"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticBoolean = exports.boolean = void 0;
const model_1 = require("../model");
const shared_1 = require("./shared");
const BOOLEAN_TAG = 'Boolean';
function boolean(config) {
    var _a;
    const model = (config === null || config === void 0 ? void 0 : config.isLocal) ? shared_1.useLocalModel(model_1.boolean) : model_1.boolean;
    return {
        tag: BOOLEAN_TAG,
        strict: model,
        partial: model,
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: shared_1.NO_TRANSFORMATIONS,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.boolean = boolean;
exports.staticBoolean = boolean();
