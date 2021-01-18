"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const Array_1 = require("fp-ts/lib/Array");
const Decoder_1 = require("io-ts/lib/Decoder");
const show_1 = require("../node/show");
const shared_1 = require("./shared");
const VALIDATIONS = new WeakMap();
function validate(schema, request) {
    const schemaValidations = VALIDATIONS.get(schema);
    if (schemaValidations) {
        const requestValidation = schemaValidations.get(request);
        if (requestValidation) {
            return requestValidation;
        }
        else {
            const newValidation = validateTypeNode(schema, request);
            schemaValidations.set(request, newValidation);
            return newValidation;
        }
    }
    else {
        const newValidations = validateTypeNode(schema, request);
        VALIDATIONS.set(schema, new WeakMap([[request, newValidations]]));
        return newValidations;
    }
}
exports.validate = validate;
function validateNode(x, y) {
    const variableErrors = validateVariablesDefinition(x.__variables_definition__, y.__variables_definition__);
    if (shared_1.isWrappedNode(x) && shared_1.isWrappedNode(y)) {
        return [...variableErrors, ...validateWrappedNode(x, y)];
    }
    else if (shared_1.isTypeNode(x) && shared_1.isTypeNode(y)) {
        return [...variableErrors, ...validateTypeNode(x, y)];
    }
    else if (shared_1.isScalarNode(x) && shared_1.isScalarNode(y)) {
        return [...variableErrors, ...validateScalarNode(x, y)];
    }
    else if (shared_1.isSumNode(x) && shared_1.isSumNode(y)) {
        return [...variableErrors, ...validateSumNode(x, y)];
    }
    else if (x.tag === y.tag) {
        return variableErrors;
    }
    else {
        return [
            ...variableErrors,
            Decoder_1.tree(`cannot use node ${show_1.showNode.show(y)}, should be assignable to ${show_1.showNode.show(x)}`)
        ];
    }
}
function validateVariablesDefinition(x, y) {
    const errors = [];
    for (const k in y) {
        const xk = x[k];
        const yk = y[k];
        if (xk === undefined) {
            errors.push(Decoder_1.tree(`request has expected variable ${k} that is unavailable on ${JSON.stringify(x)}`));
        }
        else {
            const mErrors = validateNode(xk, yk);
            if (Array_1.isNonEmpty(mErrors)) {
                errors.push(Decoder_1.tree(`invalid request on ${k}`, mErrors));
            }
        }
    }
    return errors;
}
function validateTypeNode(x, y) {
    const xMembers = x.members;
    const yMembers = y.members;
    const errors = [];
    for (const k in yMembers) {
        const xk = xMembers[k];
        const yk = yMembers[k];
        if (xk === undefined) {
            errors.push(Decoder_1.tree(`request has expected field ${k} that is unavailable on ${show_1.showNode.show(x)}`));
        }
        else {
            const mErrors = validateNode(xk, yk);
            if (Array_1.isNonEmpty(mErrors)) {
                errors.push(Decoder_1.tree(`invalid request on ${k}`, mErrors));
            }
        }
    }
    return errors;
}
function validateWrappedNode(x, y) {
    const errors = validateNode(x.wrapped, y.wrapped);
    if (Array_1.isNonEmpty(errors)) {
        return [
            Decoder_1.tree(`invalid request within ${x.tag}<${shared_1.isMapNode(x) ? `${x.key.name || x.key.__typename || x.key.tag}, ` : ''}${x.wrapped.name || x.wrapped.__typename || x.wrapped.tag}>`, errors)
        ];
    }
    else {
        return [];
    }
}
function validateScalarNode(x, y) {
    const errors = [];
    if (x.name !== y.name) {
        errors.push(Decoder_1.tree(`scalar nodes are not the same, schema has ${x.name}, while request has ${y.name}`));
    }
    if (x.strictModel !== y.strictModel) {
        errors.push(Decoder_1.tree(`Scalar Node: ${x.name} in the schema has a different model than Scalar Node:${y.name}`));
    }
    return errors;
}
function validateSumNode(x, y) {
    const xMembers = x.membersRecord;
    const yMembers = y.membersRecord;
    const errors = [];
    for (const k in yMembers) {
        const xk = xMembers[k];
        const yk = yMembers[k];
        if (xk === undefined) {
            errors.push(Decoder_1.tree(`request has sum member ${k} that is unavailable in schema ${show_1.showTypeNode.show(xk)}`));
        }
        else {
            const mErrors = validateNode(xk, yk);
            if (Array_1.isNonEmpty(mErrors)) {
                errors.push(Decoder_1.tree(`invalid request on ${k}`, mErrors));
            }
        }
    }
    return errors;
}