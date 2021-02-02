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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nonEmptyArray = exports.fromNonEmptyArray = exports.set = exports.fromSet = exports.map = exports.fromMap = exports.either = exports.fromEither = exports.option = exports.fromOption = exports.UnknownRecord = exports.UnknownArray = exports.boolean = exports.float = exports.int = exports.number = exports.string = exports.literal = exports.fromGuard = exports.fromRefinement = void 0;
const Array_1 = require("fp-ts/Array");
const E = __importStar(require("fp-ts/Either"));
const function_1 = require("fp-ts/function");
const NonEmptyArray_1 = require("fp-ts/NonEmptyArray");
const Option_1 = require("fp-ts/Option");
const shared_1 = require("../shared");
const D = __importStar(require("io-ts/Decoder"));
const DE = __importStar(require("./DecodeError"));
const G = __importStar(require("./Guard"));
__exportStar(require("io-ts/Decoder"), exports);
const fromRefinement = (refinement, expected) => ({
    decode: (i) => {
        if (shared_1.disableValidation) {
            return D.success(i);
        }
        else {
            return refinement(i) ? D.success(i) : D.failure(i, expected);
        }
    }
});
exports.fromRefinement = fromRefinement;
const fromGuard = (guard, expected) => exports.fromRefinement(guard.is, expected);
exports.fromGuard = fromGuard;
const literal = (...values) => 
/*#__PURE__*/ exports.fromGuard(G.literal(...values), values.map((value) => JSON.stringify(value)).join(' | '));
exports.literal = literal;
exports.string = 
/*#__PURE__*/
exports.fromGuard(G.string, 'string');
const numberFromString = {
    decode: (i) => {
        if (shared_1.disableValidation) {
            return G.number.is(i) ? E.right(i) : E.right(parseFloat(i));
        }
        if (G.number.is(i)) {
            return E.right(i);
        }
        else {
            const val = parseFloat(i);
            return Number.isNaN(val)
                ? E.left(D.error(i, 'expect a number or string representing a number'))
                : E.right(val);
        }
    }
};
exports.number = 
/*#__PURE__*/
exports.fromGuard(G.number, 'number');
exports.int = 
/*#__PURE__*/
D.compose(exports.fromGuard(G.int, 'integer'))(numberFromString);
exports.float = 
/*#__PURE__*/
D.compose(exports.fromGuard(G.float, 'float'))(numberFromString);
exports.boolean = exports.fromGuard(G.boolean, 'boolean');
exports.UnknownArray = exports.fromGuard(G.UnknownArray, 'Array<unknown>');
exports.UnknownRecord = exports.fromGuard(G.UnknownRecord, 'Record<string, unknown>');
const fromOption = (a) => {
    return {
        decode: (i) => {
            if (i === null || i === undefined) {
                return D.success(Option_1.none);
            }
            else {
                return function_1.pipe(a.decode(i), E.map(Option_1.some));
            }
        }
    };
};
exports.fromOption = fromOption;
const option = (a) => exports.fromOption(a);
exports.option = option;
const fromEither = (l, r) => function_1.pipe(D.map(E.right)(r), D.alt(() => D.map(E.left)(l)));
exports.fromEither = fromEither;
const either = (l, r) => exports.fromEither(l, r);
exports.either = either;
const fromMap = (k, a) => {
    return {
        decode: (i) => {
            const record = exports.UnknownRecord.decode(i);
            if (E.isLeft(record)) {
                return record;
            }
            const decodedMap = new Map();
            const errors = [];
            for (const [key, value] of Object.entries(record.right)) {
                const decodedKey = k.decode(key);
                const decodedValue = a.decode(value);
                if (Array_1.isEmpty(errors) && E.isRight(decodedKey) && E.isRight(decodedValue)) {
                    decodedMap.set(decodedKey.right, decodedValue.right);
                }
                else {
                    if (E.isLeft(decodedKey)) {
                        errors.push(decodedKey.left);
                    }
                    if (E.isLeft(decodedValue)) {
                        errors.push(decodedValue.left);
                    }
                }
            }
            if (Array_1.isNonEmpty(errors)) {
                return E.left(NonEmptyArray_1.fold(DE.getSemigroup())(errors));
            }
            return E.right(decodedMap);
        }
    };
};
exports.fromMap = fromMap;
const map = (k, a) => function_1.pipe(exports.UnknownRecord, D.compose(exports.fromMap(k, a)));
exports.map = map;
const toSet = (values) => new Set(values);
const fromSet = (a) => {
    const d = D.fromArray(a);
    return {
        decode: (i) => function_1.pipe(d.decode(i), E.map(toSet))
    };
};
exports.fromSet = fromSet;
const set = (a) => exports.fromSet(a);
exports.set = set;
const fromNonEmptyArray = (item) => {
    return D.compose(exports.fromRefinement(Array_1.isNonEmpty, 'NonEmptyArray<A>'))(D.fromArray(item));
};
exports.fromNonEmptyArray = fromNonEmptyArray;
const nonEmptyArray = (item) => exports.fromNonEmptyArray(item);
exports.nonEmptyArray = nonEmptyArray;
