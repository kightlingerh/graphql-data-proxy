"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticString = exports.string = void 0;
const Model_1 = require("../model/Model");
const shared_1 = require("./shared");
const STRING_TAG = 'String';
function string(config) {
    var _a;
    const model = (config === null || config === void 0 ? void 0 : config.isLocal) ? shared_1.useLocalModel(Model_1.string) : Model_1.string;
    return {
        tag: STRING_TAG,
        strict: model,
        partial: model,
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: shared_1.NO_TRANSFORMATIONS,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.string = string;
exports.staticString = string();
