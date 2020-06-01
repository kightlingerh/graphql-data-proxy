import * as M from '../model/Model';
import { constEmptyString, isEmptyObject, once } from '../shared';
export const showNode = {
    show: (node) => {
        switch (node.tag) {
            case 'Boolean':
            case 'Number':
            case 'String':
                return node.tag;
            case 'Scalar':
                return `Scalar: ${node.name}`;
            case 'Map':
                return `Map<${showNode.show(node.key)}, ${showNode.show(node.wrapped)}>`;
            case 'Option':
                return `Option<${showNode.show(node.wrapped)}>`;
            case 'Array':
                return `Array<${showNode.show(node.wrapped)}`;
            case 'NonEmptyArray':
                return `NonEmptyArray<${showNode.show(node.wrapped)}`;
            case 'Sum':
                return showSumNode.show(node);
            case 'Type':
                return showTypeNode.show(node);
            default:
                return node.tag;
        }
    }
};
export const showSumNode = {
    show: (node) => `{ ${Object.keys(node.members)
        .map((k) => `${k}: ${node.members[k].__typename}`)
        .join(', ')} }`
};
export const showTypeNode = {
    show: (node) => `{ ${Object.keys(node.members)
        .map((k) => `${k}: ${node.members[k].tag} ${node.members[k].__typename || node.members[k].name || ''}`.trimEnd())
        .join(', ')} }`
};
export const EMPTY_VARIABLES_MODEL = M.type({});
export function getVariablesModel(variables) {
    return isEmptyObject(variables) ? EMPTY_VARIABLES_MODEL : M.type(variables);
}
export const EMPTY_VARIABLES = {};
export function number(variables = EMPTY_VARIABLES) {
    return {
        tag: 'Number',
        print: constEmptyString,
        variables: {
            definition: variables,
            model: getVariablesModel(variables)
        },
        model: {
            whole: M.number,
            partial: M.number
        }
    };
}
export const staticNumber = number();
export function isNumberNode(u) {
    return u.tag === 'Number';
}
export function string(variables = EMPTY_VARIABLES) {
    return {
        tag: 'String',
        print: constEmptyString,
        variables: {
            model: getVariablesModel(variables),
            definition: variables
        },
        model: {
            whole: M.string,
            partial: M.string
        }
    };
}
export const staticString = string();
export function isStringNode(u) {
    return u.tag === 'String';
}
export function boolean(variables = EMPTY_VARIABLES) {
    return {
        tag: 'Boolean',
        print: constEmptyString,
        variables: {
            model: getVariablesModel(variables),
            definition: variables
        },
        model: {
            whole: M.boolean,
            partial: M.boolean
        }
    };
}
export const staticBoolean = boolean();
export function isBooleanNode(u) {
    return u.tag === 'Boolean';
}
export function isLiteralNode(u) {
    return isNumberNode(u) || isStringNode(u) || isBooleanNode(u);
}
export function type(__typename, members, variables = EMPTY_VARIABLES) {
    const models = extractTypeMemberModels(members);
    return {
        __typename,
        tag: 'Type',
        members,
        variables: {
            model: getVariablesModel(variables),
            definition: variables
        },
        print: printTypeNodeMembers(members),
        model: {
            whole: M.type(models),
            partial: M.partial(models)
        }
    };
}
function extractTypeMemberModels(members) {
    const x = {};
    Object.keys(members).forEach((key) => {
        x[key] = members[key].model;
    });
    return x;
}
const OPEN_BRACKET = '{';
const CLOSE_BRACKET = '}';
const OPEN_PAREN = '(';
const CLOSE_PAREN = ')';
const COLON = ':';
const DOLLAR_SIGN = '$';
const EXCLAMATION = '!';
function printTypeNodeMembers(members) {
    return once(() => {
        const tokens = [OPEN_BRACKET];
        for (const [key, value] of Object.entries(members)) {
            tokens.push(key);
            if (isEmptyObject(value.variables)) {
                tokens.push(COLON, value.print());
            }
            else {
                tokens.push(printVariablesNode(value.variables), COLON, value.print());
            }
        }
        tokens.push(CLOSE_BRACKET);
        return tokens.join('');
    });
}
function printVariablesNode(variables) {
    const tokens = [OPEN_PAREN];
    const keys = Object.keys(variables);
    const length = keys.length;
    const last = length - 1;
    let i = 0;
    for (; i < length; i++) {
        const key = keys[i];
        tokens.push(DOLLAR_SIGN, key, COLON, printVariableName(variables[key]), i === last ? '' : ', ');
    }
    tokens.push(CLOSE_PAREN);
    return tokens.join('');
}
function printVariableName(node, isOptional = false) {
    const optionalString = isOptional ? '' : EXCLAMATION;
    switch (node.tag) {
        case 'Array':
        case 'NonEmptyArray':
            return `[${printVariableName(node.wrapped, isOptionNode(node.wrapped))}]${optionalString}`;
        case 'Map':
            return `Map[${printVariableName(node.key)}, ${printVariableName(node.wrapped, isOptionNode(node.wrapped))}]${optionalString}`;
        case 'Option':
            return printVariableName(node.wrapped, true);
        case 'Boolean':
        case 'Number':
        case 'String':
            return `${node.tag}${optionalString}`;
        case 'Scalar':
            return `${node.name}${optionalString}`;
        case 'Type':
            return `${node.__typename}${optionalString}`;
        default:
            return '';
    }
}
export function isTypeNode(u) {
    return u.tag === 'Type';
}
export function map(key, value, variables = EMPTY_VARIABLES) {
    return {
        tag: 'Map',
        model: {
            whole: M.map(key.model.whole, value.model.whole),
            partial: M.map(key.model.whole, value.model.partial)
        },
        key,
        wrapped: value,
        variables: {
            definition: variables,
            model: getVariablesModel(variables)
        },
        print: value.print
    };
}
export function isMapNode(u) {
    return u.tag === 'Map';
}
export function array(node, variables = EMPTY_VARIABLES) {
    return {
        tag: 'Array',
        wrapped: node,
        model: {
            whole: M.array(node.model.whole),
            partial: M.array(node.model.partial)
        },
        variables: {
            definition: variables,
            model: getVariablesModel(variables)
        },
        print: node.print
    };
}
export function isArrayNode(u) {
    return u.tag === 'Array';
}
export function sum(members, variables = EMPTY_VARIABLES) {
    return {
        tag: 'Sum',
        model: {
            whole: getSumModel(members),
            partial: getSumPartialModel(members)
        },
        print: printSumNode(members),
        members,
        variables: {
            definition: variables,
            model: getVariablesModel(variables)
        }
    };
}
export function isSumNode(x) {
    return x.tag === 'Sum';
}
function getSumModel(members) {
    const m = {};
    Object.keys(m).forEach((key) => {
        const sumNode = members[key];
        m[sumNode.__typename] = M.type(Object.assign({ __typename: M.literal(sumNode.__typename) }, extractTypeMemberModels(sumNode.members)));
    });
    return M.sum('__typename')(m);
}
function getSumPartialModel(members) {
    const m = {};
    Object.keys(m).forEach((key) => {
        const sumNode = members[key];
        m[sumNode.__typename] = M.partial(Object.assign({ __typename: M.literal(sumNode.__typename) }, extractTypeMemberModels(sumNode.members)));
    });
    return M.sum('__typename')(m);
}
const ELLIPSIS = '...';
const OPEN_SPACE = ' ';
const TYPENAME = '__typename';
const ON = 'on';
function printSumNode(members) {
    return once(() => {
        const tokens = [OPEN_BRACKET, TYPENAME];
        Object.keys(members).forEach((key) => {
            const n = members[key];
            tokens.push(ELLIPSIS, OPEN_SPACE, ON, OPEN_SPACE, n.__typename, OPEN_SPACE, printTypeNodeMembers(n.members)());
        });
        tokens.push(CLOSE_BRACKET);
        return tokens.join('');
    });
}
export function option(node, variables = EMPTY_VARIABLES) {
    return {
        tag: 'Option',
        wrapped: node,
        model: {
            whole: M.option(node.model.whole),
            partial: M.option(node.model.partial)
        },
        variables: {
            model: getVariablesModel(variables),
            definition: variables
        },
        print: node.print
    };
}
export function isOptionNode(u) {
    return u.tag === 'Option';
}
export function nonEmptyArray(node, variables = EMPTY_VARIABLES) {
    return {
        tag: 'NonEmptyArray',
        wrapped: node,
        model: {
            whole: M.nonEmptyArray(node.model.whole),
            partial: M.nonEmptyArray(node.model.partial)
        },
        variables: {
            definition: variables,
            model: getVariablesModel(variables)
        },
        print: node.print
    };
}
export function isWrappedNode(x) {
    const tag = x.tag;
    return tag === 'Map' || tag === 'Option' || tag === 'Array' || tag === 'NonEmptyArray';
}
export function scalar(name, model, variables = EMPTY_VARIABLES) {
    return {
        name,
        tag: 'Scalar',
        model: {
            whole: model,
            partial: model
        },
        variables: {
            definition: variables,
            model: getVariablesModel(variables)
        },
        print: constEmptyString
    };
}
export function isScalarNode(x) {
    return x.tag === 'Scalar';
}
