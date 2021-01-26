"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsEntity = exports.encodeById = exports.eqById = exports.omitFromType = exports.pickFromType = exports.type = exports.TYPE_TAG = void 0;
const Model_1 = require("../model/Model");
const Scalar_1 = require("./Scalar");
const shared_1 = require("./shared");
exports.TYPE_TAG = 'Type';
function useTypeMemberModel(strict, members, isLocal, useIdEncoder, useIdDecoder) {
    return shared_1.useAdjustedModel(strict ? Model_1.fromType(shared_1.extractStrictModels(members)) : Model_1.fromPartial(shared_1.extractPartialModels(members)), isLocal, useIdEncoder, useIdDecoder);
}
function type(__typename, ms, config) {
    var _a;
    const members = (config === null || config === void 0 ? void 0 : config.includeTypename) ? Object.assign(Object.assign({}, ms), { __typename: Scalar_1.scalar(__typename, Model_1.literal(__typename)) }) : ms;
    const useIdDecoder = !shared_1.hasDecodingTransformations(ms);
    const useIdEncoder = !shared_1.hasEncodingTransformations(ms);
    return {
        tag: exports.TYPE_TAG,
        __typename,
        members,
        strict: useTypeMemberModel(true, members, !!(config === null || config === void 0 ? void 0 : config.isLocal), useIdEncoder, useIdDecoder),
        partial: useTypeMemberModel(false, members, !!(config === null || config === void 0 ? void 0 : config.isLocal), useIdEncoder, useIdDecoder),
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: {
            encoding: !useIdEncoder,
            decoding: !useIdDecoder
        },
        __customCache: config === null || config === void 0 ? void 0 : config.useCustomCache,
        __isEntity: config === null || config === void 0 ? void 0 : config.isEntity,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.type = type;
function pickFromType(node, keys) {
    const n = {};
    keys.forEach((k) => {
        n[k] = node.members[k];
    });
    return type(node.__typename, n, node.variables);
}
exports.pickFromType = pickFromType;
function omitFromType(node, keys) {
    const n = {};
    keys.forEach((k) => {
        if (!keys.includes(k)) {
            n[k] = node.members[k];
        }
    });
    return type(node.__typename, n, node.variables);
}
exports.omitFromType = omitFromType;
function eqById(node) {
    return Object.assign(Object.assign({}, node), { strict: Model_1.eqById(node.strict) });
}
exports.eqById = eqById;
function encodeById(node) {
    return Object.assign(Object.assign({}, node), { strict: Model_1.useEncoder(node.strict)({
            encode: (a) => node.members.id.strict.encode(a.id)
        }) });
}
exports.encodeById = encodeById;
function markAsEntity(node) {
    return Object.assign(Object.assign({}, node), { __isEntity: true });
}
exports.markAsEntity = markAsEntity;
