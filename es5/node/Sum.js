"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sum = void 0;
const Model_1 = require("../model/Model");
const shared_1 = require("./shared");
const Type_1 = require("./Type");
const SUM_TAG = 'Sum';
function useSumMemberModelRecord(members, isStrict) {
    const x = Object.create(null);
    members.forEach((member) => {
        x[member.__typename] = isStrict ? member.strict : member.partial;
    });
    return x;
}
function useSumMemberRecord(members) {
    const x = Object.create(null);
    members.forEach((member) => {
        x[member.__typename] = member;
    });
    return x;
}
function useSumMemberModel(isStrict, members, isLocal, useIdEncoder, useIdDecoder) {
    return shared_1.useAdjustedModel(Model_1.fromSum('__typename')(useSumMemberModelRecord(members, isStrict)), isLocal, useIdEncoder, useIdDecoder);
}
function addTypenameToMembers(members) {
    return members.map((member) => member.members.hasOwnProperty('__typename')
        ? member
        : Type_1.type(member.__typename, member.members, {
            variables: member.variables,
            includeTypename: true
        }));
}
function sum(ms, config) {
    var _a;
    const newMembers = addTypenameToMembers(ms);
    const membersRecord = useSumMemberRecord(ms);
    const useIdDecoder = !shared_1.hasDecodingTransformations(membersRecord);
    const useIdEncoder = !shared_1.hasEncodingTransformations(membersRecord);
    return {
        tag: SUM_TAG,
        members: newMembers,
        membersRecord,
        strict: useSumMemberModel(true, newMembers, !!(config === null || config === void 0 ? void 0 : config.isLocal), useIdEncoder, useIdDecoder),
        partial: useSumMemberModel(false, newMembers, !!(config === null || config === void 0 ? void 0 : config.isLocal), useIdEncoder, useIdDecoder),
        variables: (_a = config === null || config === void 0 ? void 0 : config.variables) !== null && _a !== void 0 ? _a : shared_1.EMPTY_VARIABLES,
        __hasTransformations: {
            encoding: !useIdEncoder,
            decoding: !useIdDecoder
        },
        __isEntity: config === null || config === void 0 ? void 0 : config.isEntity,
        __isLocal: config === null || config === void 0 ? void 0 : config.isLocal
    };
}
exports.sum = sum;
