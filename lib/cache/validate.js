import { isNonEmpty } from 'fp-ts/lib/Array';
import { tree } from 'io-ts/lib/Decoder';
import * as D from '../document/DocumentNode';
export function validate(schema) {
    const validations = new Map();
    return (request) => {
        const validation = validations.get(request);
        if (validation) {
            return validation;
        }
        else {
            const newValidation = validateTypeNode(schema, request);
            validations.set(request, newValidation);
            return newValidation;
        }
    };
}
function validateNode(x, y) {
    if (D.isWrappedNode(x) && D.isWrappedNode(y)) {
        return validateWrappedNode(x.wrapped, y.wrapped);
    }
    else if (D.isTypeNode(x) && D.isTypeNode(y)) {
        return validateTypeNode(x, y);
    }
    else if (D.isScalarNode(x) && D.isScalarNode(y)) {
        return validateScalarNode(x, y);
    }
    else if (D.isSumNode(x) && D.isSumNode(y)) {
        return validateSumNode(x, y);
    }
    else {
        return [tree(`cannot use node ${D.showNode.show(y)}, should be assignable to ${D.showNode.show(x)}`)];
    }
}
function validateTypeNode(x, y) {
    const xMembers = x.members;
    const yMembers = y.members;
    const errors = [];
    for (const k in yMembers) {
        const xk = xMembers[k];
        const yk = yMembers[k];
        if (xk === undefined) {
            errors.push(tree(`request has expected field ${k} that is unavailable on ${D.showTypeNode.show(xk)}`));
        }
        else {
            const mErrors = validateNode(xk, yk);
            if (isNonEmpty(mErrors)) {
                errors.push(tree(`invalid request on ${k}`, mErrors));
            }
        }
    }
    return errors;
}
function validateWrappedNode(x, y) {
    const errors = validateNode(x.wrapped, y.wrapped);
    if (isNonEmpty(errors)) {
        return [
            tree(`invalid request within ${x.tag}<${D.isMapNode(x) ? `${x.key.name || x.key.__typename || x.key.tag}, ` : ''}${x.wrapped.name || x.wrapped.__typename || x.tag}>`, errors)
        ];
    }
    else {
        return [];
    }
}
function validateScalarNode(x, y) {
    const errors = [];
    if (x.name !== y.name) {
        errors.push(tree(`scalar nodes are not the same, schema has ${x.name}, while request has ${y.name}`));
    }
    if (x.model !== y.model) {
        errors.push(tree(`Scalar Node: ${x.name} in the schema has a different model than Scalar Node:${y.name}`));
    }
    return errors;
}
function validateSumNode(x, y) {
    const xMembers = x.members;
    const yMembers = y.members;
    const errors = [];
    for (const k in yMembers) {
        const xk = xMembers[k];
        const yk = yMembers[k];
        if (xk === undefined) {
            errors.push(tree(`request has sum member ${k} that is unavailable in schema ${D.showTypeNode.show(xk)}`));
        }
        else {
            const mErrors = validateNode(xk, yk);
            if (isNonEmpty(mErrors)) {
                errors.push(tree(`invalid request on ${k}`, mErrors));
            }
        }
    }
    return errors;
}
