"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scalar = void 0;
const shared_1 = require("./shared");
const SCALAR_TAG = 'Scalar';
function scalar(name, model, config) {
    var _a, _b, _c;
    const m = (config === null || config === void 0 ? void 0 : config.isLocal) ? shared_1.useLocalModel(model) : model;
    return {
        tag: SCALAR_TAG,
        name,
        strict: m,
        partial: m,
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: {
            encoding: (_b = config === null || config === void 0 ? void 0 : config.hasEncodingTransformations) !== null && _b !== void 0 ? _b : true,
            decoding: (_c = config === null || config === void 0 ? void 0 : config.hasDecodingTransformations) !== null && _c !== void 0 ? _c : true
        },
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.scalar = scalar;
