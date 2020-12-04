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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCustomCache = exports.markAsLocal = exports.markAsEntity = exports.encodeById = exports.useEncoder = exports.eqById = exports.useEq = exports.omitFromType = exports.pickFromType = exports.mutation = exports.nonEmptyArray = exports.option = exports.array = exports.map = exports.sum = exports.schema = exports.type = exports.scalar = exports.staticBoolean = exports.boolean = exports.staticString = exports.string = exports.staticFloat = exports.float = exports.staticInt = exports.int = exports.getDefinitionModel = void 0;
const function_1 = require("fp-ts/lib/function");
const M = __importStar(require("../model/Model"));
const shared_1 = require("../shared");
const EMPTY_VARIABLES_MODEL = M.type({});
const EMPTY_VARIABLES = {};
function getDefinitionModel(variables) {
    return shared_1.isEmptyObject(variables) ? EMPTY_VARIABLES_MODEL : M.type(extractTypeMemberStrictModels(variables));
}
exports.getDefinitionModel = getDefinitionModel;
function int(variables = EMPTY_VARIABLES) {
    return {
        tag: 'Int',
        strictModel: M.int,
        partialModel: M.int,
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: EMPTY_VARIABLES,
        __variables_definition__: variables
    };
}
exports.int = int;
exports.staticInt = int();
function float(variables = EMPTY_VARIABLES) {
    return {
        tag: 'Float',
        strictModel: M.float,
        partialModel: M.float,
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: EMPTY_VARIABLES,
        __variables_definition__: variables
    };
}
exports.float = float;
exports.staticFloat = float();
function string(variables = EMPTY_VARIABLES) {
    return {
        tag: 'String',
        strictModel: M.string,
        partialModel: M.string,
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: EMPTY_VARIABLES,
        __variables_definition__: variables
    };
}
exports.string = string;
exports.staticString = string();
function boolean(variables = EMPTY_VARIABLES) {
    return {
        tag: 'Boolean',
        strictModel: M.boolean,
        partialModel: M.boolean,
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: EMPTY_VARIABLES,
        __variables_definition__: variables
    };
}
exports.boolean = boolean;
exports.staticBoolean = boolean();
function scalar(name, model, variables = EMPTY_VARIABLES) {
    return {
        name,
        tag: 'Scalar',
        strictModel: model,
        partialModel: model,
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: EMPTY_VARIABLES,
        __variables_definition__: variables
    };
}
exports.scalar = scalar;
function mergeNodeVariables(node) {
    const x = {};
    for (const [k, v] of Object.entries(node.__sub_variables_definition__)) {
        if (x[k] !== undefined) {
            console.warn(`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`);
        }
        x[k] = v;
    }
    for (const [k, v] of Object.entries(node.__variables_definition__)) {
        if (x[k] !== undefined) {
            console.warn(`the variable name ${k} is being used in multiple places, try to use unique values unless you want the value overwritten`);
        }
        x[k] = v;
    }
    return x;
}
function getTypeChildrenVariables(members) {
    const x = {};
    for (const k in members) {
        Object.assign(x, mergeNodeVariables(members[k]));
    }
    return x;
}
function extractTypeMemberStrictModels(members) {
    const x = {};
    for (const key in members) {
        x[key] = members[key].strictModel;
    }
    return x;
}
function extractTypeMemberPartialModels(members) {
    const x = {};
    for (const key in members) {
        x[key] = members[key].partialModel;
    }
    return x;
}
function type(__typename, members, variables = EMPTY_VARIABLES) {
    return {
        __typename,
        tag: 'Type',
        members,
        strictModel: M.type(extractTypeMemberStrictModels(members)),
        partialModel: M.partial(extractTypeMemberPartialModels(members)),
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: getTypeChildrenVariables(members),
        __variables_definition__: variables
    };
}
exports.type = type;
function schema(__typename, members) {
    return type(__typename, members);
}
exports.schema = schema;
function getSumObject(...members) {
    const m = {};
    members.forEach((member) => {
        m[member.__typename] = M.type(Object.assign({ __typename: M.literal(member.__typename) }, extractTypeMemberStrictModels(member.members)));
    });
    return m;
}
const sumTypename = M.sum('__typename');
function getSumModel(...members) {
    return sumTypename(getSumObject(...members));
}
function getSumPartialModel(...members) {
    return sumTypename(getSumObject(...members));
}
function getSumChildrenVariables(...members) {
    const x = {};
    members.forEach((member) => Object.assign(x, mergeNodeVariables(member)));
    return x;
}
function getSumMembersRecord(...members) {
    const x = {};
    members.forEach((member) => {
        x[member.__typename] = member;
    });
    return x;
}
function sum(...members) {
    return (variables = EMPTY_VARIABLES) => {
        const newMembers = members.map((member) => member.members.hasOwnProperty('__typename')
            ? member
            : type(member.__typename, Object.assign(Object.assign({}, member.members), { __typename: scalar(member.__typename, M.literal(member.__typename)) }), member.__variables_definition__));
        return {
            members,
            tag: 'Sum',
            strictModel: getSumModel(...newMembers),
            partialModel: getSumPartialModel(...newMembers),
            variablesModel: getDefinitionModel(variables),
            membersRecord: getSumMembersRecord(...newMembers),
            __variables_definition__: variables,
            __sub_variables_definition__: getSumChildrenVariables(...newMembers)
        };
    };
}
exports.sum = sum;
function map(key, value, variables = EMPTY_VARIABLES) {
    if (!shared_1.isEmptyObject(key.__variables_definition__)) {
        console.warn(`variables will be ignored on map key`);
    }
    if (!shared_1.isEmptyObject(value.__variables_definition__)) {
        console.warn(`variables will be ignored on map value`);
    }
    return {
        key,
        tag: 'Map',
        strictModel: M.map(key.strictModel, value.strictModel),
        partialModel: M.map(key.strictModel, value.partialModel),
        variablesModel: getDefinitionModel(variables),
        wrapped: value,
        __sub_variables_definition__: mergeNodeVariables(value),
        __variables_definition__: variables
    };
}
exports.map = map;
function array(wrapped, variables = EMPTY_VARIABLES) {
    if (!shared_1.isEmptyObject(wrapped.__variables_definition__)) {
        console.warn(`variables will be ignored on array value`);
    }
    return {
        tag: 'Array',
        wrapped,
        strictModel: M.array(wrapped.strictModel),
        partialModel: M.array(wrapped.partialModel),
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: mergeNodeVariables(wrapped),
        __variables_definition__: variables
    };
}
exports.array = array;
function option(wrapped, variables = EMPTY_VARIABLES) {
    if (!shared_1.isEmptyObject(wrapped.__variables_definition__)) {
        console.warn(`variables will be ignored on option value`);
    }
    return {
        tag: 'Option',
        wrapped,
        strictModel: M.option(wrapped.strictModel),
        partialModel: M.option(wrapped.partialModel),
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: mergeNodeVariables(wrapped),
        __variables_definition__: variables
    };
}
exports.option = option;
function nonEmptyArray(wrapped, variables = EMPTY_VARIABLES) {
    if (!shared_1.isEmptyObject(wrapped.__variables_definition__)) {
        console.warn(`variables will be ignored on nonEmptyArray value`);
    }
    return {
        tag: 'NonEmptyArray',
        wrapped,
        strictModel: M.nonEmptyArray(wrapped.strictModel),
        partialModel: M.nonEmptyArray(wrapped.partialModel),
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: mergeNodeVariables(wrapped),
        __variables_definition__: variables
    };
}
exports.nonEmptyArray = nonEmptyArray;
function mutation(result, variables = EMPTY_VARIABLES) {
    return {
        tag: 'Mutation',
        result: result,
        strictModel: result.strictModel,
        partialModel: result.partialModel,
        variablesModel: getDefinitionModel(variables),
        __sub_variables_definition__: mergeNodeVariables(result),
        __variables_definition__: variables
    };
}
exports.mutation = mutation;
function pickFromType(node, ...keys) {
    const n = {};
    keys.forEach((k) => {
        n[k] = node.members[k];
    });
    return type(node.__typename, n, node.__variables_definition__);
}
exports.pickFromType = pickFromType;
function omitFromType(node, ...keys) {
    const n = {};
    const members = node.members;
    for (const k in members) {
        if (!keys.includes(k)) {
            n[k] = members[k];
        }
    }
    return type(node.__typename, n, node.__variables_definition__);
}
exports.omitFromType = omitFromType;
function useEq(node, eq) {
    return Object.assign(Object.assign({}, node), { strictModel: M.useEq(node.strictModel, eq) });
}
exports.useEq = useEq;
function eqById(node) {
    return Object.assign(Object.assign({}, node), { strictModel: M.eqById(node.strictModel) });
}
exports.eqById = eqById;
function useEncoder(node, encoder) {
    return Object.assign(Object.assign({}, node), { strictModel: M.useEncoder(node.strictModel, encoder) });
}
exports.useEncoder = useEncoder;
function encodeById(node) {
    switch (node.tag) {
        case 'Type':
            return Object.assign(Object.assign({}, node), { strictModel: M.useEncoder(node.strictModel, {
                    encode: (a) => node.members.id.strictModel.encode(a.id)
                }) });
        case 'Sum':
            const o = getSumObject(...node.members);
            return Object.assign(Object.assign({}, node), { strictModel: Object.assign(Object.assign({}, node.strictModel), { encode: (a) => {
                        return o[a.__typename].encode(a.id);
                    } }) });
    }
}
exports.encodeById = encodeById;
function markAsEntity(node) {
    return Object.assign(Object.assign({}, node), { __cache__: Object.assign(Object.assign({}, node.__cache__), { isEntity: true }) });
}
exports.markAsEntity = markAsEntity;
function markAsLocal(node) {
    return Object.assign(Object.assign({}, node), { strictModel: Object.assign(Object.assign({}, node.strictModel), { encode: function_1.constUndefined }), partialModel: Object.assign(Object.assign({}, node.partialModel), { encode: function_1.constUndefined }), __cache__: Object.assign(Object.assign({}, node.__cache__), { isLocal: true }) });
}
exports.markAsLocal = markAsLocal;
function useCustomCache(node, customCache) {
    return Object.assign(Object.assign({}, node), { __cache__: Object.assign(Object.assign({}, node.__cache__), { useCustomCache: customCache }) });
}
exports.useCustomCache = useCustomCache;
