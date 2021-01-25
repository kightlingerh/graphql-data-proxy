"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutation = void 0;
const shared_1 = require("./shared");
const MUTATION_TAG = 'Mutation';
function mutation(result, config) {
    var _a;
    return {
        tag: MUTATION_TAG,
        result,
        strict: shared_1.useAdjustedModel(result.strict, !!(config === null || config === void 0 ? void 0 : config.isLocal), result.__hasTransformations.encoding, result.__hasTransformations.decoding),
        partial: shared_1.useAdjustedModel(result.partial, !!(config === null || config === void 0 ? void 0 : config.isLocal), result.__hasTransformations.encoding, result.__hasTransformations.decoding),
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: result.__hasTransformations,
        __isEntity: config === null || config === void 0 ? void 0 : config.isEntity,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.mutation = mutation;
