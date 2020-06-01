var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { sequenceT } from 'fp-ts/lib/Apply';
import { isNonEmpty } from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import { constant } from 'fp-ts/lib/function';
import { getSemigroup } from 'fp-ts/lib/NonEmptyArray';
import * as O from 'fp-ts/lib/Option';
import { fromCompare } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { sequence, traverseWithIndex } from 'fp-ts/lib/Record';
import * as A from 'fp-ts/lib/Array';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as D from '../document/DocumentNode';
import * as MAP from 'fp-ts/lib/Map';
import { isEmptyObject } from '../shared';
const cacheErrorApplicativeValidation = TE.getTaskValidation(getSemigroup());
const cacheWriteResultMonoid = {
    empty: TE.right(taskVoid),
    concat: (x, y) => {
        return (() => __awaiter(void 0, void 0, void 0, function* () {
            const [xResult, yResult] = yield Promise.all([x(), y()]);
            if (E.isLeft(xResult) && E.isLeft(yResult)) {
                return E.left([...xResult.left, ...yResult.left]);
            }
            else if (E.isLeft(xResult) && E.isRight(yResult)) {
                yResult.right();
                return xResult;
            }
            else if (E.isLeft(yResult) && E.isRight(xResult)) {
                xResult.right();
                return yResult;
            }
            else if (E.isRight(xResult) && E.isRight(yResult)) {
                return E.right(() => __awaiter(void 0, void 0, void 0, function* () {
                    yield Promise.all([x(), y()]);
                }));
            }
            else {
                return cacheWriteResultMonoid.empty;
            }
        }));
    }
};
function taskVoid() {
    return __awaiter(this, void 0, void 0, function* () { });
}
function concatEvict(x, y) {
    return () => __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([x(), y()]);
    });
}
class Store {
    constructor(deps) {
        this.deps = deps;
        this.proxyMap = new Map();
        this.read.bind(this);
        this.write.bind(this);
        this.toRef.bind(this);
        this.toRefs.bind(this);
    }
    read(selection) {
        return (variables) => {
            return this.extractProxy(this.encodeVariables(variables)).read(selection)(variables);
        };
    }
    write(variables) {
        return this.extractProxy(this.encodeVariables(variables)).write(variables);
    }
    toRef(selection) {
        return (variables) => {
            return this.extractProxy(this.encodeVariables(variables)).toRef(selection)(variables);
        };
    }
    toRefs(selection) {
        return (variables) => {
            return this.extractProxy(this.encodeVariables(variables)).toRefs(selection)(variables);
        };
    }
    extractProxy(encodedVariables) {
        const proxy = this.proxyMap.get(encodedVariables);
        if (proxy) {
            return proxy;
        }
        else {
            const newProxy = this.make(encodedVariables);
            this.proxyMap.set(encodedVariables, newProxy);
            return newProxy;
        }
    }
    make(path) {
        return this.deps.data(Object.assign(Object.assign({}, this.deps), { path: `${this.deps.path}-${path}` }));
    }
    encodeVariables(variables) {
        return this.deps.node.variables.model.encode(variables);
    }
}
class LiteralProxy {
    constructor(deps) {
        this.deps = deps;
        this.ref = this.deps.ofRef();
        this.read.bind(this);
        this.write.bind(this);
        this.toRef.bind(this);
        this.toRefs.bind(this);
    }
    read() {
        return () => TE.rightIO(() => this.ref.value);
    }
    write() {
        return (num) => pipe(this.read()(), TE.chain((previousValue) => {
            const newValue = O.some(num);
            return pipe(TE.rightIO(() => {
                this.ref.value = newValue;
            }), TE.apSecond(this.read()()), TE.map((currentValue) => {
                return T.fromIO(() => {
                    if (newValue === currentValue) {
                        this.ref.value = previousValue;
                    }
                });
            }));
        }));
    }
    toRef() {
        return () => TE.rightIO(() => this.ref);
    }
    toRefs() {
        return this.toRef();
    }
}
export function number(variables = D.EMPTY_VARIABLES) {
    const node = D.number(variables);
    const data = (deps) => new LiteralProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
export const staticNumber = number();
export function string(variables = D.EMPTY_VARIABLES) {
    const node = D.string(variables);
    const data = (deps) => new LiteralProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
export const staticString = string();
export function boolean(variables = D.EMPTY_VARIABLES) {
    const node = D.boolean(variables);
    const data = (deps) => new LiteralProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
export const staticBoolean = boolean();
export function scalar(name, model, variables = D.EMPTY_VARIABLES) {
    const node = D.scalar(name, model, variables);
    const data = (deps) => new LiteralProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
const recordTraverse = traverseWithIndex(cacheErrorApplicativeValidation);
class BaseProxy {
    constructor(deps) {
        this.deps = deps;
        this.read.bind(this);
        this.write.bind(this);
        this.toRef.bind(this);
        this.toRefs.bind(this);
    }
    toRef(selection) {
        return (variables) => {
            return pipe(variables, this.read(selection), TE.map((o) => (O.isSome(o) ? this.deps.ofRef(o.value) : this.deps.ofRef())));
        };
    }
}
class TypeProxy extends BaseProxy {
    constructor(deps) {
        super(deps);
        this.proxy = this.getProxy();
    }
    read(selection) {
        return (variables) => {
            return pipe(selection.members, recordTraverse((k, _) => this.proxy[k].read(selection.members[k])(variables)), TE.map(sequence(O.option)));
        };
    }
    write(variables) {
        return (data) => {
            let proxyWrite = cacheWriteResultMonoid.empty;
            for (const key in this.proxy) {
                if (data[key]) {
                    proxyWrite = cacheWriteResultMonoid.concat(proxyWrite, this.proxy[key].write(variables)(data[key]));
                }
            }
            return proxyWrite;
        };
    }
    toRefs(selection) {
        return (variables) => {
            return pipe(selection, recordTraverse((k, _) => this.proxy[k].toRefs(selection.members[k])(variables)), TE.map(this.deps.ofRef));
        };
    }
    getProxy() {
        const proxy = {};
        const members = this.deps.node.members;
        for (const key in members) {
            const member = members[key];
            proxy[key] = member.store(Object.assign(Object.assign({}, this.deps), { path: `${this.deps.path}.${this.deps.node.__typename}.${key}`, node: member }));
        }
        return proxy;
    }
}
export function type(__typename, members, variables = D.EMPTY_VARIABLES) {
    const node = D.type(__typename, members, variables);
    const data = (deps) => new TypeProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
const withMap = MAP.getWitherable(fromCompare(constant(0)));
const traverseMapCacheResult = withMap.traverse(cacheErrorApplicativeValidation);
const traverseWithIndexMapCacheResult = withMap.traverseWithIndex(cacheErrorApplicativeValidation);
const sequenceMapOption = withMap.sequence(O.option);
class MapProxy extends BaseProxy {
    constructor(deps) {
        super(deps);
        this.proxy = new Map();
    }
    read(selection) {
        return (variables) => {
            return pipe(traverseMapCacheResult(this.proxy, (m) => m.read(selection.wrapped)(variables)), TE.map(sequenceMapOption));
        };
    }
    write(variables) {
        return (data) => {
            return traverseWithIndexMapCacheResult(data, ((k, v) => {
                return pipe(TE.rightIO(this.getProxy(k)), TE.chain((p) => p.write(variables)(v)));
            }));
        };
    }
    toRefs(selection) {
        return (variables) => {
            return pipe(traverseMapCacheResult(this.proxy, (m) => m.toRefs(selection.wrapped)(variables)), TE.map(this.deps.ofRef));
        };
    }
    getProxy(key) {
        return () => {
            const kProxy = this.proxy.get(key);
            if (kProxy) {
                return kProxy;
            }
            else {
                const newProxy = this.deps.node.wrapped.store(Object.assign(Object.assign({}, this.deps), { path: `${this.deps.path}-${JSON.stringify(key)}`, node: this.deps.node.wrapped }));
                this.proxy.set(key, newProxy);
                return newProxy;
            }
        };
    }
}
export function map(key, value, variables = D.EMPTY_VARIABLES) {
    const node = D.map(key, value, variables);
    const data = (deps) => new MapProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
class ArrayProxy extends BaseProxy {
    constructor(deps) {
        super(deps);
        this.proxy = [];
    }
    read(selection) {
        return (variables) => {
            return pipe(A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) => m.read(selection.wrapped)(variables)), TE.map(A.array.sequence(O.option)));
        };
    }
    write(variables) {
        return (data) => {
            return pipe(TE.rightIO(this.getProxy(data)), TE.chain((proxy) => A.array.traverseWithIndex(cacheErrorApplicativeValidation)(proxy, (i, a) => {
                return a.write(variables)(data[i]);
            })), TE.map(A.reduce(taskVoid, concatEvict)));
        };
    }
    toRefs(selection) {
        return (variables) => {
            return pipe(A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) => m.toRefs(selection.wrapped)(variables)), TE.map(this.deps.ofRef));
        };
    }
    getProxy(data) {
        return () => {
            const newProxy = data.map((_, index) => this.deps.node.wrapped.store(Object.assign(Object.assign({}, this.deps), { path: `${this.deps.path}[${index}]`, node: this.deps.node.wrapped })));
            this.proxy = newProxy;
            return newProxy;
        };
    }
}
export function array(wrapped, variables = D.EMPTY_VARIABLES) {
    const node = D.array(wrapped, variables);
    const data = (deps) => new ArrayProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
class SumProxy extends BaseProxy {
    constructor(deps) {
        super(deps);
        this.type = O.none;
        this.proxy = O.none;
    }
    read(selection) {
        return (variables) => {
            return pipe(optionSequenceT(this.proxy, this.type), O.fold(constant(TE.right(O.none)), ([p, t]) => p.read(selection.members[t])(variables)));
        };
    }
    write(variables) {
        return (data) => {
            return pipe(TE.rightIO(this.getProxy(data)), TE.chain(O.fold(constant(TE.right(taskVoid)), (p) => p.write(variables)(data))));
        };
    }
    toRefs(selection) {
        return (variables) => {
            return pipe(optionSequenceT(this.proxy, this.type), O.fold(constant(TE.right(this.deps.ofRef())), ([p, k]) => pipe(p.toRefs(selection.members[k])(variables), TE.map(this.deps.ofRef))));
        };
    }
    getProxy(data) {
        return () => {
            const members = this.deps.node.members;
            for (const k in members) {
                const member = members[k];
                if (member.model.partial.is(data)) {
                    const newProxy = O.some(member.store(Object.assign(Object.assign({}, this.deps), { path: `${this.deps.path}-${k}`, node: member })));
                    this.type = O.some(k);
                    this.proxy = newProxy;
                    return newProxy;
                }
            }
            return this.proxy;
        };
    }
}
export function sum(members, variables = D.EMPTY_VARIABLES) {
    const node = D.sum(members, variables);
    const data = (deps) => new SumProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
const optionSequenceT = sequenceT(O.option);
class OptionProxy extends BaseProxy {
    constructor(deps) {
        super(deps);
        this.proxy = O.none;
    }
    read(selection) {
        return (variables) => {
            return pipe(this.proxy, O.fold(constant(TE.right(O.none)), (p) => p.read(selection.wrapped)(variables)));
        };
    }
    write(variables) {
        return (data) => {
            return pipe(TE.rightIO(this.getProxy(data)), TE.chain((oProxy) => pipe(optionSequenceT(oProxy, data), O.fold(constant(TE.right(taskVoid)), ([proxy, data]) => proxy.write(variables)(data)))));
        };
    }
    toRefs(selection) {
        return (variables) => {
            return pipe(this.proxy, O.fold(constant(TE.right(this.deps.ofRef())), (p) => pipe(p.toRefs(selection.wrapped)(variables), TE.map(O.some), TE.map(this.deps.ofRef))));
        };
    }
    getProxy(data) {
        return () => {
            if (O.isSome(data) && O.isSome(this.proxy)) {
                return this.proxy;
            }
            else if (O.isSome(data) && O.isNone(this.proxy)) {
                const newProxy = O.some(this.deps.node.wrapped.store(Object.assign(Object.assign({}, this.deps), { path: `${this.deps.path}.value`, node: this.deps.node.wrapped })));
                this.proxy = newProxy;
                return newProxy;
            }
            else if (O.isSome(this.proxy) && O.isNone(data)) {
                this.proxy = O.none;
                return O.none;
            }
            else {
                return O.none;
            }
        };
    }
}
export function option(wrapped, variables = D.EMPTY_VARIABLES) {
    const node = D.option(wrapped, variables);
    const data = (deps) => new OptionProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
class NonEmptyArrayProxy extends BaseProxy {
    constructor(deps) {
        super(deps);
        this.proxy = [];
    }
    read(selection) {
        return (variables) => {
            return pipe(A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) => m.read(selection.wrapped)(variables)), TE.map((results) => pipe(results, A.array.sequence(O.option), O.chain((value) => (isNonEmpty(value) ? O.some(value) : O.none)))));
        };
    }
    write(variables) {
        return (data) => {
            return pipe(TE.rightIO(this.getProxy(data)), TE.chain((proxy) => A.array.traverseWithIndex(cacheErrorApplicativeValidation)(proxy, (i, a) => {
                return a.write(variables)(data[i]);
            })), TE.map(A.reduce(taskVoid, concatEvict)));
        };
    }
    toRefs(selection) {
        return (variables) => {
            return pipe(A.array.traverse(cacheErrorApplicativeValidation)(this.proxy, (m) => m.toRefs(selection.wrapped)(variables)), TE.map((val) => (isNonEmpty(val) ? this.deps.ofRef(val) : this.deps.ofRef())));
        };
    }
    getProxy(data) {
        return () => {
            const newProxy = data.map((_, index) => this.deps.node.wrapped.store(Object.assign(Object.assign({}, this.deps), { path: `${this.deps.path}[${index}]`, node: this.deps.node.wrapped })));
            this.proxy = newProxy;
            return newProxy;
        };
    }
}
export function nonEmptyArray(wrapped, variables = D.EMPTY_VARIABLES) {
    const node = D.nonEmptyArray(wrapped, variables);
    const data = (deps) => new NonEmptyArrayProxy(Object.assign(Object.assign({}, deps), { node }));
    return Object.assign(Object.assign({}, node), { data, store: (deps) => (isEmptyObject(node.variables) ? data(deps) : new Store(Object.assign({ node, data }, deps))) });
}
