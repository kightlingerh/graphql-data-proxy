"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMergedVariablesModel = exports.useVariablesModel = exports.useMergedVariables = exports.node = void 0;
const model_1 = require("../model");
const shared_1 = require("../shared");
const Array_1 = require("./Array");
const Boolean_1 = require("./Boolean");
const Float_1 = require("./Float");
const Int_1 = require("./Int");
const Map_1 = require("./Map");
const Mutation_1 = require("./Mutation");
const NonEmptyArray_1 = require("./NonEmptyArray");
const Option_1 = require("./Option");
const Scalar_1 = require("./Scalar");
const Schema_1 = require("./Schema");
const String_1 = require("./String");
const Sum_1 = require("./Sum");
const Type_1 = require("./Type");
exports.node = {
    array: Array_1.array,
    boolean: Boolean_1.boolean,
    staticBoolean: Boolean_1.staticBoolean,
    float: Float_1.float,
    staticFloat: Float_1.staticFloat,
    int: Int_1.int,
    staticInt: Int_1.staticInt,
    map: Map_1.map,
    mutation: Mutation_1.mutation,
    nonEmptyArray: NonEmptyArray_1.nonEmptyArray,
    option: Option_1.option,
    scalar: Scalar_1.scalar,
    schema: Schema_1.schema,
    string: String_1.string,
    staticString: String_1.staticString,
    sum: Sum_1.sum,
    type: Type_1.type
};
function mergeVariables(node, variables) {
    if (!shared_1.isEmptyObject(node.variables)) {
        variables.push(node.variables);
    }
    switch (node.tag) {
        case 'Type':
            for (const value of Object.values(node.members)) {
                mergeVariables(value, variables);
            }
            break;
        case 'Array':
        case 'NonEmptyArray':
        case 'Option':
        case 'Map':
            mergeVariables(node.item, variables);
            break;
        case 'Mutation':
            mergeVariables(node.result, variables);
            break;
        case 'Sum':
            node.members.forEach((member) => mergeVariables(member, variables));
            break;
    }
}
function useMergedVariables(node) {
    const definitions = [];
    mergeVariables(node, definitions); // collect variable definitions and then merge in one go
    return Object.assign(Object.create(null), ...definitions.reverse()); // reverse so that parent node variables overwrite child node variables
}
exports.useMergedVariables = useMergedVariables;
function useVariablesModel(variables) {
    const x = Object.create(null);
    for (const [key, value] of Object.entries(variables)) {
        x[key] = value.strict;
    }
    return model_1.fromType(x);
}
exports.useVariablesModel = useVariablesModel;
function useMergedVariablesModel(node) {
    return useVariablesModel(useMergedVariables(node));
}
exports.useMergedVariablesModel = useMergedVariablesModel;
