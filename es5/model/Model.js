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
exports.eqById = exports.useEq = exports.encodeById = exports.useEncoder = exports.lazy = exports.tuple = exports.either = exports.literal = exports.sum = exports.optionBoolean = exports.optionNumber = exports.optionString = exports.option = exports.set = exports.isObject = exports.map = exports.array = exports.nonEmptyArray = exports.union = exports.intersection = exports.partial = exports.type = exports.boolean = exports.float = exports.int = exports.number = exports.string = void 0;
const Array_1 = require("fp-ts/lib/Array");
const A = __importStar(require("fp-ts/lib/Array"));
const EQ = __importStar(require("fp-ts/lib/Eq"));
const function_1 = require("fp-ts/lib/function");
const pipeable_1 = require("fp-ts/lib/pipeable");
const C = __importStar(require("io-ts/lib/Codec"));
const Eq_1 = require("io-ts/lib/Eq");
const E = __importStar(require("io-ts/lib/Encoder"));
const G = __importStar(require("io-ts/lib/Guard"));
const O = __importStar(require("fp-ts/lib/Option"));
const EITHER = __importStar(require("fp-ts/lib/Either"));
const M = __importStar(require("fp-ts/lib/Map"));
const D = __importStar(require("io-ts/lib/Decoder"));
const NE = __importStar(require("fp-ts/lib/NonEmptyArray"));
const S = __importStar(require("fp-ts/lib/Set"));
exports.string = Object.assign({ equals: EQ.eqString.equals, is: G.string.is }, C.string);
exports.number = Object.assign({ equals: EQ.eqNumber.equals, is: G.number.is }, C.number);
function decodeInt(u) {
    if (G.string.is(u)) {
        try {
            const int = parseInt(u, 10);
            return isNaN(int)
                ? D.failure(`cannot decode ${JSON.stringify(u)}, should be string | number`)
                : D.success(int);
        }
        catch (_a) {
            return D.failure(`cannot decode ${JSON.stringify(u)}, should be string | number`);
        }
    }
    return pipeable_1.pipe(D.number.decode(u), EITHER.map(Math.trunc));
}
exports.int = Object.assign(Object.assign({}, exports.number), { decode: decodeInt });
function decodeFloat(u) {
    if (G.string.is(u)) {
        try {
            const int = parseFloat(u);
            return isNaN(int)
                ? D.failure(`cannot decode ${JSON.stringify(u)}, should be string | number`)
                : D.success(int);
        }
        catch (_a) {
            return D.failure(`cannot decode ${JSON.stringify(u)}, should be string | number`);
        }
    }
    return D.number.decode(u);
}
exports.float = Object.assign(Object.assign({}, exports.number), { decode: decodeFloat });
exports.boolean = Object.assign({ equals: EQ.eqBoolean.equals, is: G.boolean.is }, C.boolean);
function type(members) {
    return Object.assign({ equals: EQ.getStructEq(members).equals, is: G.type(members).is }, C.type(members));
}
exports.type = type;
function partial(members) {
    return Object.assign({ equals: Eq_1.partial(members).equals, is: G.partial(members).is }, C.partial(members));
}
exports.partial = partial;
function intersection(left, right) {
    return Object.assign({ equals: Eq_1.intersection(left, right).equals, is: G.intersection(left, right).is }, C.intersection(left, right));
}
exports.intersection = intersection;
function union(...members) {
    return {
        equals: (x, y) => {
            return members.filter((m) => m.is(x) && m.is(y)).some((m) => m.equals(x, y));
        },
        is: G.union(...members).is,
        encode: (a) => {
            return pipeable_1.pipe(members.filter((m) => m.is(a)), A.head, O.fold(function_1.constant(JSON.stringify(a)), (m) => m.encode(a)));
        },
        decode: D.union(...members).decode
    };
}
exports.union = union;
function nonEmptyArray(val) {
    const a = array(val);
    return {
        encode: (nea) => a.encode(nea),
        equals: NE.getEq(val).equals,
        is: (u) => a.is(u) && u.length > 0,
        decode: (u) => {
            const arr = a.decode(u);
            if (EITHER.isLeft(arr)) {
                return arr;
            }
            else {
                const r = arr.right;
                return Array_1.isNonEmpty(r)
                    ? D.success(r)
                    : D.failure(`expected non empty array but received ${JSON.stringify(u)}`);
            }
        }
    };
}
exports.nonEmptyArray = nonEmptyArray;
function array(val) {
    return Object.assign({ equals: A.getEq(val).equals, is: G.array(val).is }, C.array(val));
}
exports.array = array;
function map(key, value) {
    return {
        equals: M.getEq(key, value).equals,
        encode: getMapEncoder(key, value).encode,
        decode: getMapDecoder(key, value).decode,
        is: getMapGuard(key, value).is
    };
}
exports.map = map;
function getMapEncoder(key, value) {
    return {
        encode: (a) => {
            const encodedObject = {};
            for (const [k, v] of a.entries()) {
                encodedObject[key.encode(k)] = value.encode(v);
            }
            return encodedObject;
        }
    };
}
function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
exports.isObject = isObject;
function getMapDecoder(key, value) {
    return {
        decode: (u) => {
            if (!isObject(u)) {
                return EITHER.left([D.tree(`invalid value supplied as map: ${JSON.stringify(u)}, should be an object`)]);
            }
            else {
                const m = new Map();
                const errors = [];
                for (const [k, v] of Object.entries(u)) {
                    const decodedKey = key.decode(k);
                    const decodedValue = value.decode(v);
                    if (EITHER.isLeft(decodedKey)) {
                        errors.push(D.tree(`invalid key supplied ${JSON.stringify(k)}`, decodedKey.left));
                        console.log(`invalid key supplied ${JSON.stringify(k)}`);
                    }
                    if (EITHER.isLeft(decodedValue)) {
                        errors.push(D.tree(`invalid value supplied ${JSON.stringify(v)}`, decodedValue.left));
                    }
                    if (EITHER.isRight(decodedKey) && EITHER.isRight(decodedValue)) {
                        m.set(decodedKey.right, decodedValue.right);
                    }
                }
                return Array_1.isNonEmpty(errors) ? EITHER.left(errors) : EITHER.right(m);
            }
        }
    };
}
function getMapGuard(key, value) {
    return {
        is: (u) => {
            if (typeof Map !== undefined && u instanceof Map) {
                for (const [k, v] of u.entries()) {
                    if (!key.is(k) || !value.is(v)) {
                        return false;
                    }
                }
                return true;
            }
            else {
                return false;
            }
        }
    };
}
function set(model) {
    const a = array(model);
    return {
        equals: S.getEq(model).equals,
        encode: function_1.flow(setToArray, a.encode),
        decode: function_1.flow(a.decode, EITHER.map(arrayToSet)),
        is: (u) => {
            if (typeof Set !== undefined && u instanceof Set) {
                for (const v of u.values()) {
                    if (!model.is(v)) {
                        return false;
                    }
                }
                return true;
            }
            else {
                return false;
            }
        }
    };
}
exports.set = set;
function setToArray(set) {
    const x = [];
    set.forEach((e) => x.push(e));
    return x;
}
function arrayToSet(a) {
    return new Set(a);
}
function option(val, lazy = function_1.constNull) {
    return {
        equals: O.getEq(val).equals,
        decode: (u) => u === null || u === undefined
            ? EITHER.right(O.none)
            : pipeable_1.pipe(u, val.decode, EITHER.map(O.some)),
        encode: O.fold(lazy, val.encode),
        is: getOptionGuard(val).is
    };
}
exports.option = option;
const noneGuard = G.type({ _tag: G.literal('None') });
const _tagGuardSum = G.sum('_tag');
function getOptionGuard(guard) {
    return _tagGuardSum({
        None: noneGuard,
        Some: G.type({ _tag: G.literal('Some'), value: guard })
    });
}
exports.optionString = option(exports.string);
exports.optionNumber = option(exports.number);
exports.optionBoolean = option(exports.boolean);
function sum(tag) {
    return (members) => {
        return {
            equals: Eq_1.sum(tag)(members).equals,
            encode: E.sum(tag)(members).encode,
            is: G.sum(tag)(members).is,
            decode: D.sum(tag)(members).decode
        };
    };
}
exports.sum = sum;
function literal(...values) {
    return {
        equals: EQ.eqStrict.equals,
        is: G.literal(...values).is,
        decode: D.literal(...values).decode,
        encode: E.id.encode
    };
}
exports.literal = literal;
function getEitherGuard(left, right) {
    return _tagGuardSum({
        Left: G.type({ _tag: G.literal('Left'), left }),
        Right: G.type({ _tag: G.literal('Right'), right })
    });
}
function either(left, right) {
    return {
        equals: EITHER.getEq(left, right).equals,
        is: getEitherGuard(left, right).is,
        decode: (u) => {
            const r = right.decode(u);
            if (EITHER.isRight(r)) {
                return EITHER.right(r);
            }
            const l = left.decode(u);
            if (EITHER.isRight(l)) {
                return EITHER.right(EITHER.left(l.right));
            }
            return EITHER.left([...l.left, ...r.left]);
        },
        encode: (a) => (EITHER.isRight(a) ? right.encode(a.right) : left.encode(a.left))
    };
}
exports.either = either;
function tuple(...models) {
    return {
        equals: Eq_1.tuple(...models).equals,
        is: G.tuple(...models).is,
        decode: D.tuple(...models).decode,
        encode: E.tuple(...models).encode
    };
}
exports.tuple = tuple;
function lazy(id, model) {
    return {
        equals: Eq_1.lazy(model).equals,
        is: G.lazy(model).is,
        decode: D.lazy(id, model).decode,
        encode: E.lazy(model).encode
    };
}
exports.lazy = lazy;
function useEncoder(model, encoder) {
    return Object.assign(Object.assign({}, model), encoder);
}
exports.useEncoder = useEncoder;
function encodeById(model) {
    return Object.assign(Object.assign({}, model), { encode: (x) => E.id.encode(x.id) });
}
exports.encodeById = encodeById;
function useEq(model, eq) {
    return Object.assign(Object.assign({}, model), eq);
}
exports.useEq = useEq;
function eqById(model) {
    return Object.assign(Object.assign({}, model), { equals: (x, y) => x.id === y.id });
}
exports.eqById = eqById;
