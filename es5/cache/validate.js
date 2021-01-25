"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const Array_1 = require("fp-ts/lib/Array");
const Tree_1 = require("fp-ts/Tree");
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
    const variableErrors = validateVariablesDefinition(x.variables, y.variables);
    if (y.tag === 'Mutation') {
        return [...variableErrors, Tree_1.make(`cannot include mutations in a cache request`)];
    }
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
            Tree_1.make(`cannot use node ${show_1.showNode.show(y)}, should be assignable to ${show_1.showNode.show(x)}`)
        ];
    }
}
function validateVariablesDefinition(x, y) {
    const errors = [];
    for (const k in y) {
        const xk = x[k];
        const yk = y[k];
        if (xk === undefined) {
            errors.push(Tree_1.make(`request has expected variable ${k} that is unavailable on ${JSON.stringify(x)}`));
        }
        else {
            const mErrors = validateNode(xk, yk);
            if (Array_1.isNonEmpty(mErrors)) {
                errors.push(Tree_1.make(`invalid request on ${k}`, mErrors));
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
            errors.push(Tree_1.make(`request has expected field ${k} that is unavailable on ${show_1.showNode.show(x)}`));
        }
        else {
            const mErrors = validateNode(xk, yk);
            if (Array_1.isNonEmpty(mErrors)) {
                errors.push(Tree_1.make(`invalid request on ${k}`, mErrors));
            }
        }
    }
    return errors;
}
function validateWrappedNode(x, y) {
    const errors = validateNode(x.item, y.item);
    if (Array_1.isNonEmpty(errors)) {
        return [
            Tree_1.make(`invalid request within ${x.tag}<${shared_1.isMapNode(x) ? `${x.key.name || x.key.__typename || x.key.tag}, ` : ''}${x.item.name || x.item.__typename || x.item.tag}>`, errors)
        ];
    }
    else {
        return [];
    }
}
function validateScalarNode(x, y) {
    const errors = [];
    if (x.name !== y.name) {
        errors.push(Tree_1.make(`scalar nodes are not the same, schema has ${x.name}, while request has ${y.name}`));
    }
    if (x.strict !== y.strict) {
        errors.push(Tree_1.make(`Scalar Node: ${x.name} in the schema has a different model than Scalar Node:${y.name}`));
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
            errors.push(Tree_1.make(`request has sum member ${k} that is unavailable in schema ${show_1.showTypeNode.show(xk)}`));
        }
        else {
            const mErrors = validateNode(xk, yk);
            if (Array_1.isNonEmpty(mErrors)) {
                errors.push(Tree_1.make(`invalid request on ${k}`, mErrors));
            }
        }
    }
    return errors;
}
