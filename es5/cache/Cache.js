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
exports.make = void 0;
const Array_1 = require("fp-ts/lib/Array");
const Either_1 = require("fp-ts/lib/Either");
const function_1 = require("fp-ts/lib/function");
const IO_1 = require("fp-ts/lib/IO");
const NonEmptyArray_1 = require("fp-ts/lib/NonEmptyArray");
const Option_1 = require("fp-ts/lib/Option");
const vue_1 = require("vue");
const N = __importStar(require("../node"));
const shared_1 = require("../shared");
const shared_2 = require("./shared");
const validate_1 = require("./validate");
function make(deps) {
    return (schema) => {
        var _a;
        const rootPath = NonEmptyArray_1.of((_a = deps.id) !== null && _a !== void 0 ? _a : 'root');
        const uniqueNodes = new Map();
        const cache = useTypeNodeCacheEntry(schema, rootPath, uniqueNodes, {});
        return (request) => {
            const errors = validate_1.validate(schema, request);
            if (Array_1.isNonEmpty(errors)) {
                return Either_1.left(errors);
            }
            else {
                return Either_1.right({
                    read: (variables) => () => read(schema, request, rootPath, uniqueNodes, deps, variables, cache),
                    write: (variables) => (data) => () => write(data, schema, request, rootPath, uniqueNodes, deps, variables, cache),
                    toEntries: (variables) => () => toEntries(schema, request, rootPath, uniqueNodes, deps, variables, cache)
                });
            }
        };
    };
}
exports.make = make;
function toEntries(schema, request, path, uniqueNodes, deps, variables, cache) {
    if (shared_2.isPrimitiveNode(schema)) {
        return cache;
    }
    if (shared_2.isNonPrimitiveEntityNode(request)) {
        return vue_1.computed(() => read(schema, request, path, uniqueNodes, deps, variables, cache));
    }
    switch (request.tag) {
        case 'Type':
            return toEntriesTypeNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Array':
            return toEntriesArrayNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'NonEmptyArray':
            return toEntriesNonEmptyArrayNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Option':
            return toEntriesOptionNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Map':
            return toEntriesMapNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Sum':
            return toEntriesSumNode(schema, request, path, uniqueNodes, deps, variables, cache);
        default:
            return cache;
    }
}
function toEntriesTypeNode(schema, request, path, uniqueNodes, deps, variables, entry) {
    const x = {};
    for (const k in request.members) {
        const memberPath = Array_1.snoc(path, k);
        x[k] = toEntries(schema.members[k], request.members[k], memberPath, uniqueNodes, deps, variables, useTypeNodeMemberCacheEntry(k, schema, memberPath, uniqueNodes, variables, entry));
    }
    return x;
}
function toEntriesArrayNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    return cache.map((val, i) => toEntries(schema.item, request.item, Array_1.snoc(path, i), uniqueNodes, deps, variables, val));
}
function toEntriesNonEmptyArrayNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    return vue_1.computed(() => Option_1.map((entry) => entry.map((val, index) => toEntries(schema.item, request.item, path.concat(['some', index]), uniqueNodes, deps, variables, val)))(cache.value));
}
function toEntriesOptionNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    return vue_1.computed(() => Option_1.map((entry) => toEntries(schema.item, request.item, Array_1.snoc(path, 'some'), uniqueNodes, deps, variables, entry))(cache.value));
}
function toEntriesMapNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    return shared_2.traverseMapWithKey((key, val) => toEntries(schema.item, request.item, Array_1.snoc(path, key), uniqueNodes, deps, variables, val))(cache);
}
function toEntriesSumNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    return vue_1.computed(() => Option_1.isNone(cache.value)
        ? Option_1.none
        : toEntriesTypeNode(schema.membersRecord[cache.value.value[0]], request.membersRecord[cache.value.value[0]], path, uniqueNodes, deps, variables, cache.value.value[1]));
}
function read(schema, request, path, uniqueNodes, deps, variables, cache) {
    if (shared_2.isPrimitiveNode(schema) || !!(schema === null || schema === void 0 ? void 0 : schema.__isEntity)) {
        return cache.value;
    }
    switch (request.tag) {
        case 'Type':
            return readTypeNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Array':
            return readArrayNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'NonEmptyArray':
            return readNonEmptyArrayNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Option':
            return readOptionNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Map':
            return readMapNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Sum':
            return readSumNode(schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Mutation':
            return Option_1.none;
        default:
            return cache.value;
    }
}
function readTypeNode(schema, request, path, uniqueNodes, deps, variables, entry) {
    const x = {};
    for (const k in request.members) {
        const result = read(schema.members[k], request.members[k], Array_1.snoc(path, k), uniqueNodes, deps, variables, useTypeNodeMemberCacheEntry(k, schema, Array_1.snoc(path, k), uniqueNodes, variables, entry));
        if (Option_1.isNone(result)) {
            return Option_1.none;
        }
        x[k] = result.value;
    }
    return Option_1.some(x);
}
function readArrayNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    const length = cache.length;
    const sw = schema.item;
    const rw = request.item;
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
        const r = read(sw, rw, Array_1.snoc(path, i), uniqueNodes, deps, variables, cache[i]);
        if (Option_1.isNone(r)) {
            return Option_1.none;
        }
        result[i] = r.value;
    }
    return Option_1.some(result);
}
function readNonEmptyArrayNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    if (Option_1.isSome(cache.value)) {
        return readArrayNode(schema, request, Array_1.snoc(path, 'some'), uniqueNodes, deps, variables, cache.value.value);
    }
    else {
        return Option_1.none;
    }
}
function readOptionNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    return function_1.pipe(cache.value, Option_1.map((entry) => read(schema.item, request.item, Array_1.snoc(path, 'some'), uniqueNodes, deps, variables, entry)));
}
function readMapNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    if (cache.size === 0) {
        return Option_1.some(new Map());
    }
    else {
        const result = new Map();
        const sw = schema.item;
        const rw = request.item;
        for (const [key, value] of cache.entries()) {
            const r = read(sw, rw, Array_1.snoc(path, key), uniqueNodes, deps, variables, value);
            if (Option_1.isNone(r)) {
                return Option_1.none;
            }
            result.set(key, r.value);
        }
        return Option_1.some(result);
    }
}
function readSumNode(schema, request, path, uniqueNodes, deps, variables, cache) {
    return Option_1.isNone(cache.value)
        ? Option_1.none
        : readTypeNode(schema.membersRecord[cache.value.value[0]], request.membersRecord[cache.value.value[0]], path, uniqueNodes, deps, variables, cache.value.value[1]);
}
function write(data, schema, request, path, uniqueNodes, deps, variables, cache) {
    if (!!(schema === null || schema === void 0 ? void 0 : schema.__isEntity)) {
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
            return writeToTypeNode(data, schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Array':
            return writeToArrayNode(data, schema, request, path, uniqueNodes, deps, variables, cache);
        case 'NonEmptyArray':
            return writeToNonEmptyArrayNode(data, schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Option':
            return writeToOptionNode(data, schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Map':
            return writeToMapNode(data, schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Sum':
            return writeToSumNode(data, schema, request, path, uniqueNodes, deps, variables, cache);
        case 'Mutation':
            return function_1.constVoid;
    }
}
function writeToEntity(data, cache) {
    const currentValue = cache.value;
    const newValue = Option_1.some(data);
    cache.value = newValue;
    return () => {
        if (cache.value === newValue) {
            cache.value = currentValue;
        }
    };
}
function writeToTypeNode(data, schema, request, path, uniqueNodes, deps, variables, entry) {
    const evictions = [];
    for (const k in data) {
        const keyPath = Array_1.snoc(path, k);
        evictions.push(write(data[k], schema.members[k], request.members[k], keyPath, uniqueNodes, deps, variables, useTypeNodeMemberCacheEntry(k, schema, keyPath, uniqueNodes, variables, entry, data[k])));
    }
    return IO_1.sequenceArray(evictions);
}
function writeToArrayNode(data, schema, request, path, uniqueNodes, deps, variables, entry) {
    const evictions = [];
    const newLength = data.length;
    const oldLength = entry.length;
    if (newLength > oldLength) {
        evictions.push(() => {
            if (entry.length === newLength) {
                entry.splice(oldLength, newLength - oldLength);
            }
        });
    }
    else {
        const deletedValues = entry.splice(newLength, oldLength - newLength);
        evictions.push(() => {
            if (entry.length === newLength) {
                for (let i = newLength; i < oldLength; i++) {
                    entry[i] = deletedValues[i - newLength];
                }
            }
        });
    }
    data.forEach((val, index) => {
        let indexEntry = entry[index];
        if (!indexEntry) {
            indexEntry = useCacheEntry(schema.item, Array_1.snoc(path, index), uniqueNodes, variables, data[index]);
            entry[index] = indexEntry;
        }
        evictions.push(write(val, schema.item, request.item, Array_1.snoc(path, index), uniqueNodes, deps, variables, indexEntry));
    });
    return IO_1.sequenceArray(evictions);
}
function writeToNonEmptyArrayNode(data, schema, request, path, uniqueNodes, deps, variables, entry) {
    const currentValue = entry.value;
    if (Option_1.isSome(currentValue)) {
        return writeToArrayNode(data, schema, request, path, uniqueNodes, deps, variables, currentValue.value);
    }
    const newValue = Option_1.some(vue_1.shallowReactive([]));
    writeToArrayNode(data, schema, request, path, uniqueNodes, deps, variables, newValue.value);
    entry.value = newValue;
    return () => {
        if (entry.value === newValue) {
            entry.value = currentValue;
        }
    };
}
function writeToOptionNode(data, schema, request, path, uniqueNodes, deps, variables, cache) {
    const currentValue = cache.value;
    if (Option_1.isSome(data)) {
        if (Option_1.isNone(currentValue)) {
            cache.value = Option_1.some(useCacheEntry(schema.item, path, uniqueNodes, variables, data));
            write(data.value, schema.item, request.item, Array_1.snoc(path, 'some'), uniqueNodes, deps, variables, cache.value.value);
            return () => {
                cache.value = currentValue;
            };
        }
        return write(data.value, schema.item, request.item, Array_1.snoc(path, 'some'), uniqueNodes, deps, variables, cache.value.value);
    }
    else {
        cache.value = Option_1.none;
        return () => {
            cache.value = currentValue;
        };
    }
}
function writeToMapNode(data, schema, request, path, uniqueNodes, deps, variables, cache) {
    const evictions = [];
    for (const [k, v] of data.entries()) {
        const keyPath = Array_1.snoc(path, k);
        if (cache.has(k)) {
            if (v === null || v === undefined) {
                const currentValue = useMapNodeKeyCacheEntry(k, schema, keyPath, uniqueNodes, variables, cache, data.get(k));
                cache.delete(k);
                evictions.push(() => {
                    if (!cache.has(k)) {
                        cache.set(k, currentValue);
                    }
                });
            }
            else {
                evictions.push(write(v, schema.item, request.item, keyPath, uniqueNodes, deps, variables, useMapNodeKeyCacheEntry(k, schema, keyPath, uniqueNodes, variables, cache, data.get(k))));
            }
        }
        else {
            const newCacheEntry = useMapNodeKeyCacheEntry(k, schema, keyPath, uniqueNodes, variables, cache, data.get(k));
            cache.set(k, newCacheEntry);
            write(v, schema.item, request.item, keyPath, uniqueNodes, deps, variables, newCacheEntry);
            evictions.push(() => cache.delete(k));
        }
    }
    return IO_1.sequenceArray(evictions);
}
function writeToSumNode(data, schema, request, path, uniqueNodes, deps, variables, cache) {
    if ((Option_1.isNone(cache.value) && data.__typename) ||
        (Option_1.isSome(cache.value) && data.__typename && cache.value.value[0] !== data.__typename)) {
        const currentValue = cache.value;
        const __typename = data.__typename;
        const newNode = useTypeNodeCacheEntry(schema.membersRecord[__typename], path, uniqueNodes, variables, data);
        cache.value = Option_1.some([__typename, newNode]);
        writeToTypeNode(data, schema.membersRecord[__typename], request.membersRecord[__typename], path, uniqueNodes, deps, variables, newNode);
        return () => {
            if (Option_1.isSome(cache.value) && cache.value.value[0] === __typename && cache.value.value[1] === newNode) {
                cache.value = currentValue;
            }
        };
    }
    if (Option_1.isSome(cache.value) && (data.__typename === undefined || data.__typename === cache.value.value[0])) {
        const __typename = cache.value.value[0];
        return writeToTypeNode(data, schema.membersRecord[__typename], request.membersRecord[__typename], path, uniqueNodes, deps, variables, cache.value.value[1]);
    }
    return function_1.absurd;
}
function useMapNodeKeyCacheEntry(key, schema, path, uniqueNodes, variables, entry, data) {
    const itemNode = schema.item;
    if ((itemNode.tag === 'Map' || itemNode.tag === 'Type') && itemNode.__customCache !== undefined) {
        // @ts-ignore
        const id = itemNode.__customCache.toId(path, variables, data);
        if (id) {
            const memberCustomCache = useCustomCache(uniqueNodes, itemNode, path, id, variables, data);
            if (memberCustomCache !== entry.get(key)) {
                entry.set(key, memberCustomCache);
            }
            return memberCustomCache;
        }
    }
    let keyEntry = entry.get(key);
    if (!keyEntry) {
        keyEntry = useCacheEntry(itemNode, path, uniqueNodes, variables, data);
        entry.set(key, keyEntry);
    }
    return keyEntry;
}
function useTypeNodeMemberCacheEntry(member, schema, path, uniqueNodes, variables, entry, data) {
    const memberNode = schema.members[member];
    if ((memberNode.tag === 'Map' || memberNode.tag === 'Type') && memberNode.__customCache !== undefined) {
        // @ts-ignore
        const id = memberNode.__customCache.toId(path, variables, data);
        if (id) {
            const memberCustomCache = useCustomCache(uniqueNodes, memberNode, path, id, variables, data);
            if (memberCustomCache !== entry[member]) {
                entry[member] = memberCustomCache;
            }
        }
        return entry[member];
    }
    if (shared_1.isEmptyObject(memberNode.variables)) {
        return entry[member];
    }
    const encodedVariables = encode(schema.members[member], variables);
    let memberCache = entry[member].get(encodedVariables);
    if (!memberCache) {
        memberCache = useCacheEntry(schema.members[member], path, uniqueNodes, variables);
        entry[member].set(encodedVariables, memberCache);
    }
    return memberCache;
}
function useCustomCache(uniqueNodes, member, path, id, variables, data) {
    const entry = uniqueNodes.get(id);
    if (entry) {
        return entry;
    }
    else {
        const newEntry = useCacheEntry(member, path, uniqueNodes, variables, data);
        uniqueNodes.set(id, newEntry);
        return newEntry;
    }
}
function useTypeNodeCacheEntry(schema, path, uniqueNodes, variables, data) {
    const x = {};
    for (const k in schema.members) {
        const member = schema.members[k];
        const newPath = Array_1.snoc(path, k);
        if ((member.tag === 'Map' || member.tag === 'Type') && member.__customCache !== undefined) {
            // @ts-ignore
            const id = member.__customCache.toId(newPath, variables, data);
            if (id) {
                x[k] = useCustomCache(uniqueNodes, member, newPath, id, variables, data);
            }
            else {
                x[k] = useCacheEntry(member, newPath, uniqueNodes, variables, data);
            }
        }
        else if (!shared_1.isEmptyObject(member.variables)) {
            x[k] = new Map();
        }
        else {
            x[k] = useCacheEntry(member, newPath, uniqueNodes, variables, data);
        }
    }
    return vue_1.shallowReactive(x);
}
function useMapNodeCacheEntry(schema, path, uniqueNodes, variables, data) {
    if (schema.__customCache) {
        const id = schema.__customCache.toId(path, variables, data);
        if (id) {
            const entry = uniqueNodes.get(id);
            if (entry) {
                return entry;
            }
            else {
                const newEntry = vue_1.shallowReactive(new Map());
                uniqueNodes.set(id, newEntry);
                return newEntry;
            }
        }
    }
    return vue_1.shallowReactive(new Map());
}
const ENCODERS = new WeakMap();
function useEncoder(node) {
    let encoder = ENCODERS.get(node);
    if (encoder) {
        return encoder;
    }
    encoder = N.useMergedVariablesModel(node);
    ENCODERS.set(node, encoder);
    return encoder;
}
function encode(node, data) {
    try {
        return JSON.stringify(useEncoder(node).encode(data));
    }
    catch (_a) {
        return 'unknown';
    }
}
function useCacheEntry(node, path, uniqueNodes, variables, data) {
    if (shared_2.isPrimitiveNode(node) || !!node.__isEntity) {
        return vue_1.shallowRef(Option_1.none);
    }
    switch (node.tag) {
        case 'Type':
            return useTypeNodeCacheEntry(node, path, uniqueNodes, variables, data);
        case 'Array':
            return vue_1.shallowReactive([]);
        case 'Map':
            return useMapNodeCacheEntry(node, path, uniqueNodes, variables, data);
        case 'Mutation':
            return useCacheEntry(node.result, path, uniqueNodes, variables, data);
        default:
            return vue_1.shallowRef(Option_1.none);
    }
}
