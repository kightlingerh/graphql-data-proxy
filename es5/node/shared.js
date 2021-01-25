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
exports.hasDecodingTransformations = exports.hasEncodingTransformations = exports.useAdjustedModel = exports.useLocalModel = exports.HAS_TRANSFORMATIONS = exports.NO_TRANSFORMATIONS = exports.extractPartialModels = exports.extractStrictModels = exports.EMPTY_VARIABLES_MODEL = exports.EMPTY_VARIABLES = void 0;
const function_1 = require("fp-ts/function");
const M = __importStar(require("../model/Model"));
exports.EMPTY_VARIABLES = {};
exports.EMPTY_VARIABLES_MODEL = M.type({});
function extractStrictModels(members) {
    const x = Object.create(null);
    for (const key in members) {
        x[key] = members[key].strict;
    }
    return x;
}
exports.extractStrictModels = extractStrictModels;
function extractPartialModels(members) {
    const x = Object.create(null);
    for (const key in members) {
        x[key] = members[key].partial;
    }
    return x;
}
exports.extractPartialModels = extractPartialModels;
exports.NO_TRANSFORMATIONS = {
    decoding: false,
    encoding: false
};
exports.HAS_TRANSFORMATIONS = {
    decoding: true,
    encoding: true
};
function useLocalModel(model) {
    return Object.assign(Object.assign({}, model), { encode: function_1.constUndefined });
}
exports.useLocalModel = useLocalModel;
function useAdjustedModel(model, isLocal, useIdEncoder, useIdDecoder) {
    if (isLocal) {
        return useLocalModel(model);
    }
    if (__DEV__ || !__DISABLE_VALIDATION__) {
        return model;
    }
    if (useIdEncoder && useIdDecoder) {
        return M.useIdentityDecoder(M.useIdentityEncoder(model));
    }
    if (useIdEncoder) {
        return M.useIdentityEncoder(model);
    }
    if (useIdDecoder) {
        return M.useIdentityDecoder(model);
    }
    return model;
}
exports.useAdjustedModel = useAdjustedModel;
function hasEncodingTransformations(ms) {
    var _a, _b;
    for (const k in ms) {
        if ((_b = (_a = ms[k]) === null || _a === void 0 ? void 0 : _a.__hasTransformations) === null || _b === void 0 ? void 0 : _b.encoding) {
            return true;
        }
    }
    return false;
}
exports.hasEncodingTransformations = hasEncodingTransformations;
function hasDecodingTransformations(ms) {
    var _a, _b;
    for (const k in ms) {
        if ((_b = (_a = ms[k]) === null || _a === void 0 ? void 0 : _a.__hasTransformations) === null || _b === void 0 ? void 0 : _b.decoding) {
            return true;
        }
    }
    return false;
}
exports.hasDecodingTransformations = hasDecodingTransformations;
