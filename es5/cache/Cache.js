"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make = void 0;
const vue_1 = require("vue");
const Array_1 = require("fp-ts/lib/Array");
const Either_1 = require("fp-ts/lib/Either");
const function_1 = require("fp-ts/lib/function");
const Map_1 = require("fp-ts/lib/Map");
const Option_1 = require("fp-ts/lib/Option");
const Ord_1 = require("fp-ts/lib/Ord");
const shared_1 = require("../shared");
const shared_2 = require("./shared");
const validate_1 = require("./validate");
function make(_) {
    return (schema) => {
        const cache = Object.create(null);
        console.log(cache);
        return (request) => {
            const errors = validate_1.validate(schema, request);
            if (Array_1.isNonEmpty(errors)) {
                return Either_1.left(errors);
            }
            else {
                return Either_1.right({
                    read: (variables) => read(schema, request, variables, cache),
                    write: (variables) => (data) => write(data, schema, request, variables, cache),
                    toRefs: (variables) => toRefs(schema, request, variables, cache)
                });
            }
        };
    };
}
exports.make = make;
function toRefs(schema, request, variables, cache) {
    if (shared_2.isEntityNode(schema)) {
        return () => cache;
    }
    if (shared_2.isEntityNode(request)) {
        return () => vue_1.computed(read(schema, request, variables, cache));
    }
    switch (request.tag) {
        case 'Type':
            return toRefsTypeNode(schema, request, variables, cache);
        case 'Array':
            return toRefsArrayNode(schema, request, variables, cache);
        case 'NonEmptyArray':
            return toRefsNonEmptyArrayNode(schema, request, variables, cache);
        case 'Option':
            return toRefsOptionNode(schema, request, variables, cache);
        case 'Map':
            return toRefsMapNode(schema, request, variables, cache);
        case 'Sum':
            return toRefsSumNode(schema, request, variables, cache);
        default:
            return cache;
    }
}
function toRefsTypeNode(schema, request, variables, entry) {
    return () => {
        const x = {};
        for (const k in request.members) {
            x[k] = toRefs(schema.members[k], request.members[k], variables, getTypeNodeMemberCacheEntry(k, schema, request, variables, entry))();
        }
        return x;
    };
}
function toRefsArrayNode(schema, request, variables, cache) {
    return () => {
        return vue_1.computed(() => cache.value.map((val) => toRefs(schema.wrapped, request.wrapped, variables, val)()));
    };
}
function toRefsNonEmptyArrayNode(schema, request, variables, cache) {
    return () => {
        return vue_1.computed(() => function_1.pipe(cache.value, Option_1.map((entry) => entry.map((val) => toRefs(schema.wrapped, request.wrapped, variables, val)()))));
    };
}
function toRefsOptionNode(schema, request, variables, cache) {
    return () => {
        return vue_1.computed(() => function_1.pipe(cache.value, Option_1.map((entry) => toRefs(schema.wrapped, request.wrapped, variables, entry)())));
    };
}
function toRefsMapNode(schema, request, variables, cache) {
    return () => {
        return vue_1.computed(() => function_1.pipe(cache.value, Map_1.map((val) => toRefs(schema.wrapped, request.wrapped, variables, val)())));
    };
}
function toRefsSumNode(schema, request, variables, cache) {
    return () => vue_1.computed(() => Option_1.isNone(cache.value)
        ? Option_1.none
        : readTypeNode(schema.membersRecord[cache.value.value[0]], request.membersRecord[cache.value.value[0]], variables, cache.value.value[1])());
}
function read(schema, request, variables, cache) {
    if (shared_2.isEntityNode(schema)) {
        return readEntity(cache);
    }
    switch (request.tag) {
        case 'Type':
            return readTypeNode(schema, request, variables, cache);
        case 'Array':
            return readArrayNode(schema, request, variables, cache);
        case 'NonEmptyArray':
            return readNonEmptyArrayNode(schema, request, variables, cache);
        case 'Option':
            return readOptionNode(schema, request, variables, cache);
        case 'Map':
            return readMapNode(schema, request, variables, cache);
        case 'Sum':
            return readSumNode(schema, request, variables, cache);
        case 'Mutation':
            return function_1.constant(Option_1.none);
        default:
            return readEntity(cache);
    }
}
function readEntity(cache) {
    return () => cache.value;
}
function readTypeNode(schema, request, variables, entry) {
    return () => {
        const x = {};
        for (const k in request.members) {
            const result = read(schema.members[k], request.members[k], variables, getTypeNodeMemberCacheEntry(k, schema, request, variables, entry))();
            if (Option_1.isNone(result)) {
                return Option_1.none;
            }
            x[k] = result.value;
        }
        return Option_1.some(x);
    };
}
function getTypeNodeMemberCacheEntry(member, schema, request, variables, entry, data) {
    if (entry[member] === undefined) {
        entry[member] = shared_1.isEmptyObject(schema.members[member].__variables_definition__)
            ? useStaticCacheEntry(schema.members[member], request.members[member], variables, data && data[member])
            : new Map();
    }
    let memberCache;
    if (shared_1.isEmptyObject(schema.members[member].__variables_definition__)) {
        memberCache = entry[member];
    }
    else {
        const encodedVariables = encode(schema.members[member], variables);
        memberCache = entry[member].get(encodedVariables);
        if (!memberCache) {
            memberCache = useStaticCacheEntry(schema.members[member], request.members[member], variables, data && data[member]);
            entry[member].set(encodedVariables, memberCache);
        }
    }
    return memberCache;
}
const arrayTraverseOption = Array_1.traverse(Option_1.option);
function readArrayNode(schema, request, variables, cache) {
    return () => arrayTraverseOption((val) => read(schema.wrapped, request.wrapped, variables, val)())(cache.value);
}
function readNonEmptyArrayNode(schema, request, variables, cache) {
    return () => {
        return function_1.pipe(cache.value, Option_1.chain((entry) => arrayTraverseOption((val) => read(schema.wrapped, request.wrapped, variables, val)())(entry)));
    };
}
function readOptionNode(schema, request, variables, cache) {
    return () => {
        return Option_1.some(function_1.pipe(cache.value, Option_1.chain((entry) => read(schema.wrapped, request.wrapped, variables, entry)())));
    };
}
const mapSequenceOption = Map_1.getWitherable(Ord_1.fromCompare(function_1.constant(0))).sequence(Option_1.option);
function readMapNode(schema, request, variables, cache) {
    return () => {
        return function_1.pipe(cache.value, Map_1.map((val) => read(schema.wrapped, request.wrapped, variables, val)()), mapSequenceOption);
    };
}
function readSumNode(schema, request, variables, cache) {
    return () => Option_1.isNone(cache.value)
        ? Option_1.none
        : readTypeNode(schema.membersRecord[cache.value.value[0]], request.membersRecord[cache.value.value[0]], variables, cache.value.value[1])();
}
function write(data, schema, request, variables, cache) {
    var _a;
    if ((_a = schema === null || schema === void 0 ? void 0 : schema.__cache__) === null || _a === void 0 ? void 0 : _a.isEntity) {
        return writeToEntity(data, cache);
    }
    switch (request.tag) {
        case 'Scalar':
        case 'String':
        case 'Float':
        case 'Boolean':
        case 'Int':
            return writeToEntity(data, cache);
        case 'Type':
            return writeToTypeNode(data, schema, request, variables, cache);
        case 'Array':
            return writeToArrayNode(data, schema, request, variables, cache);
        case 'NonEmptyArray':
            return writeToNonEmptyArrayNode(data, schema, request, variables, cache);
        case 'Option':
            return writeToOptionNode(data, schema, request, variables, cache);
        case 'Map':
            return writeToMapNode(data, schema, request, variables, cache);
        case 'Sum':
            return writeToSumNode(data, schema, request, variables, cache);
        case 'Mutation':
            return shared_1.cacheWriteResultMonoid.empty;
    }
}
function writeToEntity(data, cache) {
    return () => {
        const currentValue = cache.value;
        const newValue = Option_1.some(data);
        cache.value = newValue;
        return () => {
            if (cache.value === newValue) {
                cache.value = currentValue;
            }
        };
    };
}
function writeToTypeNode(data, schema, request, variables, entry) {
    return () => {
        let evict = function_1.constVoid;
        for (const k in data) {
            evict = shared_1.concatEvict(evict, write(data[k], schema.members[k], request.members[k], variables, getTypeNodeMemberCacheEntry(k, schema, request, variables, entry, data))());
        }
        return evict;
    };
}
function writeToArrayNode(data, schema, request, variables, entry) {
    return () => {
        const currentValue = entry.value;
        const newValue = Array_1.makeBy(data.length, (i) => useStaticCacheEntry(schema.wrapped, request.wrapped, variables, data[i]));
        data.forEach((val, index) => {
            write(val, schema.wrapped, request.wrapped, variables, newValue[index])();
        });
        entry.value = newValue;
        return () => {
            if (entry.value === newValue)
                entry.value = currentValue;
        };
    };
}
function writeToNonEmptyArrayNode(data, schema, request, variables, entry) {
    return () => {
        const currentValue = entry.value;
        const newValue = Option_1.some(Array_1.makeBy(data.length, (i) => useStaticCacheEntry(schema.wrapped, request.wrapped, variables, data[i])));
        data.forEach((val, index) => write(val, schema.wrapped, request.wrapped, variables, newValue.value[index])());
        entry.value = newValue;
        return () => {
            if (entry.value === newValue) {
                entry.value = currentValue;
            }
        };
    };
}
function writeToOptionNode(data, schema, request, variables, cache) {
    return () => {
        const currentValue = cache.value;
        if (Option_1.isSome(data)) {
            if (Option_1.isNone(currentValue)) {
                cache.value = Option_1.some(useStaticCacheEntry(schema.wrapped, request.wrapped, variables, data));
                write(data.value, schema.wrapped, request.wrapped, variables, cache.value.value)();
                return () => {
                    cache.value = currentValue;
                };
            }
            return write(data.value, schema.wrapped, request.wrapped, variables, cache.value.value)();
        }
        else {
            cache.value = Option_1.none;
            return () => {
                cache.value = currentValue;
            };
        }
    };
}
function writeToMapNode(data, schema, request, variables, cache) {
    return () => {
        const cacheValue = cache.value;
        let evict = function_1.constVoid;
        for (const [k, v] of data.entries()) {
            if (cacheValue.has(k)) {
                if (v === null || v === undefined) {
                    const currentValue = cacheValue.get(k);
                    cacheValue.delete(k);
                    evict = shared_1.concatEvict(evict, () => {
                        if (!cacheValue.has(k)) {
                            cacheValue.set(k, currentValue);
                        }
                    });
                }
                else {
                    evict = shared_1.concatEvict(evict, write(v, schema.wrapped, request.wrapped, variables, cacheValue.get(k))());
                }
            }
            else {
                const newCacheEntry = useStaticCacheEntry(schema.wrapped, request.wrapped, variables, v);
                cacheValue.set(k, newCacheEntry);
                write(v, schema.wrapped, request.wrapped, variables, newCacheEntry)();
                evict = shared_1.concatEvict(evict, () => cacheValue.delete(k));
            }
        }
        return evict;
    };
}
function writeToSumNode(data, schema, request, variables, cache) {
    return () => {
        if (Option_1.isNone(cache.value) || (data.__typename && cache.value.value[0] !== data.__typename)) {
            cache.value = Option_1.some([
                data.__typename,
                useStaticCacheEntry(schema.membersRecord[data.__typename], request.membersRecord[data.__typename], variables, data)
            ]);
        }
        const __typename = data.__typename || cache.value.value[0];
        if (!!__typename) {
            return writeToTypeNode(data, schema.membersRecord[__typename], request.membersRecord[__typename], variables, cache.value.value[1])();
        }
        else {
            return function_1.constVoid;
        }
    };
}
function useStaticCacheEntry(schemaNode, requestNode, variables, data) {
    var _a;
    if (!!((_a = schemaNode === null || schemaNode === void 0 ? void 0 : schemaNode.__cache__) === null || _a === void 0 ? void 0 : _a.useCustomCache)) {
        const customCacheEntry = schemaNode.__cache__.useCustomCache(schemaNode, requestNode, variables, data);
        return Option_1.isSome(customCacheEntry) ? customCacheEntry.value : useDefaultCacheEntry(schemaNode);
    }
    else {
        return useDefaultCacheEntry(schemaNode);
    }
}
function encode(node, data) {
    try {
        return JSON.stringify(node.variablesModel.encode(data));
    }
    catch (_a) {
        return 'unknown';
    }
}
function useDefaultCacheEntry(node) {
    if (shared_2.isEntityNode(node)) {
        return vue_1.shallowRef(Option_1.none);
    }
    switch (node.tag) {
        case 'Type':
            return Object.create(null);
        case 'Array':
            return vue_1.shallowRef([]);
        case 'NonEmptyArray':
        case 'Sum':
        case 'Option':
            return vue_1.shallowRef(Option_1.none);
        case 'Map':
            return vue_1.shallowRef(vue_1.shallowReactive(new Map()));
        case 'Mutation':
            return useDefaultCacheEntry(node.result);
        default:
            return vue_1.shallowRef(Option_1.none);
    }
}
