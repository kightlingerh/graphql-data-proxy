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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
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
        const cache = new SchemaCacheNode(schema, deps);
        return (request) => {
            if (shared_1.isDev) {
                const errors = validate_1.validate(schema, request, false);
                if (Array_1.isNonEmpty(errors)) {
                    return Either_1.left(errors);
                }
            }
            return Either_1.right({
                read: cache.useRead(request),
                write: cache.write,
                toEntries: cache.useToEntries(request)
            });
        };
    };
}
exports.make = make;
class SchemaCacheNode {
    constructor(schemaNode, deps) {
        this.pendingWrites = [];
        this.hasActiveWrite = false;
        this.entry = new TypeCacheNode(schemaNode, deps.id ? [deps.id] : ['root'], new Map(), deps);
        this.useRead = this.useRead.bind(this);
        this.write = this.write.bind(this);
        this.useToEntries = this.useToEntries.bind(this);
        this.applyWrites = this.applyWrites.bind(this);
    }
    useRead(requestNode) {
        return (variables) => () => this.entry.read(requestNode, variables);
    }
    applyWrites() {
        this.hasActiveWrite = false;
        const task = this.pendingWrites.shift();
        if (task) {
            this.hasActiveWrite = true;
            task().then(this.applyWrites);
        }
    }
    write(variables) {
        return (data) => {
            return () => new Promise((resolve) => {
                this.pendingWrites.push(() => this.entry.write(variables, data).then(resolve));
                // if this is the only task in the queue, start applying writes, otherwise other writes are in progress
                if (!this.hasActiveWrite) {
                    this.applyWrites();
                }
            });
        };
    }
    useToEntries(requestNode) {
        return (variables) => () => this.entry.toEntries(requestNode, variables);
    }
}
class CacheNode {
    constructor(schemaNode, path, deps) {
        this.schemaNode = schemaNode;
        this.path = path;
        this.deps = deps;
    }
    toEntries(requestNode, variables) {
        return shared_2.isNonPrimitiveEntityNode(requestNode)
            ? vue_1.computed(() => this.read(requestNode, variables))
            : this.useEntries(requestNode, variables);
    }
}
class PrimitiveCacheNode extends CacheNode {
    constructor(schemaNode, path, deps) {
        super(schemaNode, path, deps);
        this.entry = vue_1.shallowRef(Option_1.none);
    }
    read() {
        return this.entry.value;
    }
    useEntries() {
        return this.entry;
    }
    write(_, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentValue = this.entry.value;
            this.entry.value = Option_1.some(value);
            return () => {
                // check that another write hasn't already occurred
                if (Option_1.isSome(this.entry.value) && this.entry.value.value === value) {
                    this.entry.value = currentValue;
                }
            };
        });
    }
}
function useNewCacheNode(node, path, uniqueNodes, deps) {
    if (!!node.__isEntity) {
        return new PrimitiveCacheNode(node, path, deps);
    }
    switch (node.tag) {
        case 'Map':
            return new MapCacheNode(node, path, uniqueNodes, deps);
        case 'Option':
            return new OptionCacheNode(node, path, uniqueNodes, deps);
        case 'NonEmptyArray':
            return new NonEmptyArrayCacheNode(node, path, uniqueNodes, deps);
        case 'Array':
            return new ArrayCacheNode(node, path, uniqueNodes, deps);
        case 'Sum':
            return new SumCacheNode(node, path, uniqueNodes, deps);
        case 'Type':
            return new TypeCacheNode(node, path, uniqueNodes, deps);
        default:
            return new PrimitiveCacheNode(node, path, deps);
    }
}
class SumCacheNode extends CacheNode {
    constructor(schemaNode, path, uniqueNodes, deps) {
        super(schemaNode, path, deps);
        this.uniqueNodes = uniqueNodes;
        this.entry = vue_1.shallowRef(Option_1.none);
    }
    read(requestNode, variables) {
        return Option_1.isSome(this.entry.value)
            ? this.entry.value.value[1].read(requestNode.membersRecord[this.entry.value.value[0]], variables)
            : Option_1.none;
    }
    useEntries(requestNode, variables) {
        return vue_1.computed(() => Option_1.isSome(this.entry.value)
            ? Option_1.some(this.entry.value.value[1].toEntries(requestNode.membersRecord[this.entry.value.value[0]], variables))
            : Option_1.none);
    }
    useNewNode(__typename) {
        const newNode = new TypeCacheNode(this.schemaNode.membersRecord[__typename], this.path, this.uniqueNodes, this.deps);
        this.entry.value = Option_1.some([__typename, newNode]);
        return newNode;
    }
    setNewValue(variables, data, currentValue, __typename) {
        return __awaiter(this, void 0, void 0, function* () {
            const newNode = this.useNewNode(__typename);
            yield newNode.write(variables, data);
            return () => {
                if (Option_1.isSome(this.entry.value) &&
                    this.entry.value.value[0] === __typename &&
                    this.entry.value.value[1] === newNode) {
                    this.entry.value = currentValue;
                }
            };
        });
    }
    write(variables, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Option_1.isNone(this.entry.value) && data.__typename) {
                return this.setNewValue(variables, data, Option_1.none, data.__typename);
            }
            // check if current value needs to be overwritten
            if (Option_1.isSome(this.entry.value) && data.__typename && this.entry.value.value[0] !== data.__typename) {
                return this.setNewValue(variables, data, this.entry.value, data.__typename);
            }
            if (Option_1.isSome(this.entry.value) &&
                (data.__typename === undefined || data.__typename === this.entry.value.value[0])) {
                return this.entry.value.value[1].write(variables, data);
            }
            return function_1.absurd;
        });
    }
}
class TypeCacheNode extends CacheNode {
    constructor(schemaNode, path, uniqueNodes, deps) {
        super(schemaNode, path, deps);
        this.uniqueNodes = uniqueNodes;
        this.models = {};
        if (schemaNode.__customCache) {
            const id = schemaNode.__customCache.toId(path);
            if (id) {
                this.shouldCheckId = false;
                const entry = uniqueNodes.get(id);
                if (entry) {
                    this.entry = entry;
                }
                else {
                    this.entry = vue_1.shallowRef(this.buildEntry());
                    uniqueNodes.set(id, this.entry);
                }
            }
            else {
                this.shouldCheckId = true;
                this.entry = vue_1.shallowRef(this.buildEntry());
            }
        }
        else {
            this.shouldCheckId = false;
            this.entry = vue_1.shallowRef(this.buildEntry());
        }
    }
    shouldUseDynamicEntry(member) {
        const hasVariables = !shared_1.isEmptyObject(member.variables);
        if (member.tag === 'Map' || member.tag === 'Type') {
            return member.__customCache !== undefined ? false : hasVariables;
        }
        return hasVariables;
    }
    buildEntry() {
        const newEntry = {};
        for (const key in this.schemaNode.members) {
            const member = this.schemaNode.members[key];
            const shouldUseDynamicEntry = this.shouldUseDynamicEntry(member);
            newEntry[key] = shouldUseDynamicEntry
                ? new Map()
                : useNewCacheNode(member, Array_1.snoc(this.path, key), this.uniqueNodes, this.deps);
            if (shouldUseDynamicEntry) {
                this.models[key] = N.useVariablesModel(member.variables);
            }
        }
        return newEntry;
    }
    useEntry(variables, data) {
        if (this.shouldCheckId && this.schemaNode.__customCache) {
            const customCache = this.schemaNode.__customCache;
            const id = customCache.toId(this.path, variables, data);
            if (id === null || id === undefined) {
                return this.entry.value;
            }
            else {
                this.shouldCheckId = false;
                let newEntry = this.uniqueNodes.get(id);
                if (newEntry) {
                    if (newEntry !== this.entry.value) {
                        this.entry.value = newEntry;
                    }
                    return newEntry;
                }
                this.uniqueNodes.set(id, this.entry.value);
                return this.entry.value;
            }
        }
        return this.entry.value;
    }
    useCacheNode(entry, key, variables) {
        if (this.models.hasOwnProperty(key)) {
            const encodedVariables = JSON.stringify(this.models[key].encode(variables));
            const newEntry = entry[key].get(encodedVariables);
            if (newEntry) {
                return newEntry;
            }
            else {
                const n = useNewCacheNode(this.schemaNode.members[key], [...this.path, encodedVariables, key], this.uniqueNodes, this.deps);
                entry[key].set(encodedVariables, n);
                return n;
            }
        }
        return entry[key];
    }
    read(requestNode, variables) {
        const result = {};
        const entry = this.useEntry(variables);
        for (const key in requestNode.members) {
            const r = this.useCacheNode(entry, key, variables).read(requestNode.members[key], variables);
            if (Option_1.isNone(r)) {
                return Option_1.none;
            }
            result[key] = r.value;
        }
        return Option_1.some(result);
    }
    useEntries(requestNode, variables) {
        const requestEntries = {};
        const entry = this.useEntry(variables);
        for (const key in requestNode.members) {
            const node = this.useCacheNode(entry, key, variables);
            requestEntries[key] = node.toEntries(requestNode.members[key], variables);
        }
        return requestEntries;
    }
    write(variables, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const evictions = [];
            const entry = this.useEntry(variables, data);
            for (const key in data) {
                evictions.push(this.useCacheNode(entry, key, variables).write(variables, data[key]));
            }
            return IO_1.sequenceArray(yield Promise.all(evictions));
        });
    }
}
class MapCacheNode extends CacheNode {
    constructor(schemaNode, path, uniqueNodes, deps) {
        super(schemaNode, path, deps);
        this.uniqueNodes = uniqueNodes;
        this.shouldCheckId = true;
        if (this.schemaNode.__customCache) {
            const id = this.schemaNode.__customCache.toId(this.path);
            if (id) {
                this.shouldCheckId = false;
                let entry = this.uniqueNodes.get(id);
                if (entry) {
                    this.entry = entry;
                }
                else {
                    const newEntry = vue_1.shallowReactive(new Map());
                    this.uniqueNodes.set(id, newEntry);
                    this.entry = newEntry;
                }
            }
            else {
                this.entry = vue_1.shallowReactive(new Map());
            }
        }
        else {
            this.shouldCheckId = false;
            this.entry = vue_1.shallowReactive(new Map());
        }
    }
    useEntry(variables, data) {
        if (this.shouldCheckId && this.schemaNode.__customCache) {
            const id = this.schemaNode.__customCache.toId(this.path, variables, data);
            if (id) {
                this.shouldCheckId = false;
                let entry = this.uniqueNodes.get(id);
                if (entry && entry !== this.entry) {
                    // copy entry
                    this.entry.clear();
                    for (const [key, value] of entry.entries()) {
                        this.entry.set(key, value);
                    }
                }
                else {
                    this.uniqueNodes.set(id, this.entry);
                }
            }
        }
        return this.entry;
    }
    read(requestNode, variables) {
        const newMap = new Map();
        for (const [key, value] of this.useEntry(variables).entries()) {
            const readValue = value.read(requestNode.item, variables);
            if (Option_1.isNone(readValue)) {
                return Option_1.none;
            }
            newMap.set(key, readValue.value);
        }
        return Option_1.some(newMap);
    }
    useNodeEntries(requestNode, variables) {
        return (node) => node.toEntries(requestNode, variables);
    }
    useEntries(requestNode, variables) {
        return shared_2.traverseMap(this.useNodeEntries(requestNode.item, variables))(this.useEntry(variables));
    }
    useCacheNode(key, variables) {
        const keyEntry = this.useEntry(variables).get(key);
        if (keyEntry) {
            return [keyEntry, false];
        }
        const newEntry = useNewCacheNode(this.schemaNode.item, Array_1.snoc(this.path, key), this.uniqueNodes, this.deps);
        this.useEntry().set(key, newEntry);
        return [newEntry, true];
    }
    useWriteToNode(variables) {
        const entry = this.useEntry(variables);
        return (key, data) => __awaiter(this, void 0, void 0, function* () {
            const [node, isNew] = this.useCacheNode(key, variables);
            if (data === null || data === undefined) {
                if (isNew) {
                    // there is already no data at this key, so nothing to evict
                    return function_1.constVoid;
                }
                entry.delete(key);
                return () => {
                    if (!this.entry.has(key)) {
                        this.entry.set(key, node);
                    }
                };
            }
            if (isNew) {
                yield node.write(variables, data);
                return () => {
                    this.entry.delete(key);
                };
            }
            return node.write(variables, data);
        });
    }
    write(variables, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const _write = this.useWriteToNode(variables);
            const evictions = [];
            let iteration = 0;
            for (const [key, value] of data.entries()) {
                evictions.push(_write(key, value));
                // give main thread a break every 100 writes
                if (iteration % 100 === 0) {
                    yield Promise.resolve();
                }
                iteration++;
            }
            return IO_1.sequenceArray(yield Promise.all(evictions));
        });
    }
}
class ArrayCacheNode extends CacheNode {
    constructor(schemaNode, path, uniqueNodes, deps) {
        super(schemaNode, path, deps);
        this.uniqueNodes = uniqueNodes;
        this.entry = vue_1.shallowReactive([]);
        this.useCacheNode = this.useCacheNode.bind(this);
        this.writeToNode = this.writeToNode.bind(this);
        this.readNode = this.readNode.bind(this);
    }
    readNode(requestNode, variables) {
        return (node) => node.read(requestNode, variables);
    }
    read(requestNode, variables) {
        const result = [];
        const length = this.entry.length;
        const read = this.readNode(requestNode.item, variables);
        for (let i = 0; i < length; i++) {
            const r = read(this.entry[i]);
            if (Option_1.isNone(r)) {
                return Option_1.none;
            }
            result.push(r.value);
        }
        return Option_1.some(result);
    }
    useEntries(requestNode, variables) {
        return this.entry.map((n) => n.toEntries(requestNode.item, variables));
    }
    useCacheNode(index) {
        let isNew = false;
        let indexEntry = this.entry[index];
        if (!indexEntry) {
            indexEntry = useNewCacheNode(this.schemaNode.item, Array_1.snoc(this.path, index), this.uniqueNodes, this.deps);
            this.entry[index] = indexEntry;
            isNew = true;
        }
        return [indexEntry, isNew];
    }
    writeToNode(variables) {
        return (index, data) => __awaiter(this, void 0, void 0, function* () {
            if (data === null || data === undefined) {
                const [cv] = this.entry.splice(index, 1);
                const newLength = this.entry.length;
                return () => {
                    if (this.entry.length === newLength) {
                        this.entry.splice(index, 0, cv);
                    }
                };
            }
            const [node, isNew] = this.useCacheNode(index);
            if (isNew) {
                yield node.write(variables, data);
                return () => {
                    if (this.entry[index] !== undefined) {
                        this.entry.splice(index, 1);
                    }
                };
            }
            return node.write(variables, data);
        });
    }
    write(variables, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!!this.deps.useImmutableArrays) {
                this.entry.length = data.length;
            }
            const _write = this.writeToNode(variables);
            const length = data.length;
            const evictions = [];
            for (let i = 0; i < length; i++) {
                evictions.push(_write(i, data[i]));
                // give main thread a break every 100 writes
                if (i % 100 === 0) {
                    yield Promise.resolve();
                }
            }
            return IO_1.sequenceArray(yield Promise.all(evictions));
        });
    }
}
class NonEmptyArrayCacheNode {
    constructor(schemaNode, path, uniqueNodes, deps) {
        this.schemaNode = schemaNode;
        this.path = path;
        this.uniqueNodes = uniqueNodes;
        this.deps = deps;
        this.cache = new ArrayCacheNode(schemaNode, path, uniqueNodes, deps);
    }
    read(requestNode, variables) {
        return function_1.pipe(this.cache.read(requestNode, variables), Option_1.chain(NonEmptyArray_1.fromArray));
    }
    toEntries(requestNode, variables) {
        return vue_1.computed(() => NonEmptyArray_1.fromArray(this.cache.toEntries(requestNode, variables)));
    }
    write(variables, value) {
        return this.cache.write(variables, value);
    }
}
class OptionCacheNode extends CacheNode {
    constructor(schemaNode, path, uniqueNodes, deps) {
        super(schemaNode, path, deps);
        this.uniqueNodes = uniqueNodes;
        this.isSome = vue_1.shallowRef(false);
        this.entry = useNewCacheNode(schemaNode.item, Array_1.snoc(path, 'value'), uniqueNodes, deps);
    }
    read(requestNode, variables) {
        return this.isSome.value ? Option_1.some(this.entry.read(requestNode.item, variables)) : Option_1.none;
    }
    useEntries(requestNode, variables) {
        return vue_1.computed(() => {
            return this.isSome.value ? Option_1.some(this.entry.toEntries(requestNode.item, variables)) : Option_1.none;
        });
    }
    write(variables, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const isCurrentlySome = this.isSome.value;
            if (Option_1.isSome(data)) {
                this.isSome.value = true;
                if (!isCurrentlySome) {
                    const evict = yield this.entry.write(variables, data.value);
                    return () => {
                        if (this.isSome.value) {
                            this.isSome.value = false;
                            evict();
                        }
                    };
                }
                return this.entry.write(variables, data.value);
            }
            else {
                this.isSome.value = false;
                return () => {
                    if (!this.isSome.value) {
                        this.isSome.value = true;
                    }
                };
            }
        });
    }
}
