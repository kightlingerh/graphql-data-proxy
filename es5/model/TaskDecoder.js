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
exports.lazy = exports.nonEmptyArray = exports.fromNonEmptyArray = exports.set = exports.fromSet = exports.map = exports.fromMap = exports.either = exports.fromEither = exports.option = exports.fromOption = exports.sum = exports.fromSum = exports.intersect = exports.union = exports.tuple = exports.fromTuple = exports.record = exports.fromRecord = exports.array = exports.fromArray = exports.partial = exports.fromPartial = exports.type = exports.fromType = exports.nullable = exports.parse = exports.refine = exports.withMessage = exports.mapLeftWithInput = exports.UnknownRecord = exports.UnknownArray = exports.boolean = exports.float = exports.int = exports.number = exports.string = exports.literal = exports.fromGuard = exports.fromRefinement = exports.failure = exports.success = exports.error = void 0;
// expanded version of io-ts
const E = __importStar(require("fp-ts/Either"));
const Array_1 = require("fp-ts/lib/Array");
const function_1 = require("fp-ts/lib/function");
const Option_1 = require("fp-ts/Option");
const TE = __importStar(require("fp-ts/TaskEither"));
const TD = __importStar(require("io-ts/TaskDecoder"));
const shared_1 = require("../shared");
__exportStar(require("io-ts/TaskDecoder"), exports);
const DE = __importStar(require("./DecodeError"));
const G = __importStar(require("./Guard"));
const D = __importStar(require("./Decoder"));
exports.error = D.error;
exports.success = TE.right;
const failure = (actual, message) => TE.left(D.error(actual, message));
exports.failure = failure;
const fromRefinement = (refinement, expected) => ({
    decode: (i) => {
        if (shared_1.disableValidation) {
            return exports.success(i);
        }
        else {
            return refinement(i) ? exports.success(i) : exports.failure(i, expected);
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
exports.number = 
/*#__PURE__*/
exports.fromGuard(G.number, 'number');
exports.int = 
/*#__PURE__*/
exports.fromGuard(G.int, 'integer');
exports.float = 
/*#__PURE__*/
exports.fromGuard(G.float, 'float');
exports.boolean = exports.fromGuard(G.boolean, 'boolean');
exports.UnknownArray = exports.fromGuard(G.UnknownArray, 'Array<unknown>');
exports.UnknownRecord = exports.fromGuard(G.UnknownRecord, 'Record<string, unknown>');
exports.mapLeftWithInput = TD.mapLeftWithInput;
exports.withMessage = TD.withMessage;
exports.refine = TD.refine;
exports.parse = TD.parse;
exports.nullable = TD.nullable;
exports.fromType = TD.fromType;
exports.type = TD.type;
exports.fromPartial = TD.fromPartial;
exports.partial = TD.partial;
exports.fromArray = TD.fromArray;
exports.array = TD.array;
exports.fromRecord = TD.fromRecord;
exports.record = TD.record;
exports.fromTuple = TD.fromTuple;
exports.tuple = TD.tuple;
exports.union = TD.union;
exports.intersect = TD.intersect;
exports.fromSum = TD.fromSum;
exports.sum = TD.sum;
const fromOption = (a) => {
    const d = exports.nullable(a);
    return {
        decode: (i) => function_1.pipe(d.decode(i), TE.map(Option_1.fromNullable))
    };
};
exports.fromOption = fromOption;
const option = (a) => exports.fromOption(a);
exports.option = option;
const fromEither = (l, r) => function_1.pipe(TD.map(E.right)(r), TD.alt(() => TD.map(E.left)(l)));
exports.fromEither = fromEither;
const either = (l, r) => exports.fromEither(l, r);
exports.either = either;
const mergeErrors = DE.getSemigroup().concat;
const fromMap = (k, a) => {
    return {
        decode: (i) => {
            return () => __awaiter(void 0, void 0, void 0, function* () {
                const record = yield exports.UnknownRecord.decode(i)();
                if (E.isLeft(record)) {
                    return record;
                }
                let iterations = 0;
                const pairs = [];
                for (const [key, value] of Object.entries(record.right)) {
                    pairs.push(Promise.all([k.decode(key)(), a.decode(value)()]));
                    if (iterations % 100 === 0) {
                        yield Promise.all(pairs.slice(iterations - 100, iterations));
                    }
                }
                const awaitedPairs = yield Promise.all(pairs);
                const extractedPairs = [];
                let error = null;
                for (let i = 0; i < awaitedPairs.length; i++) {
                    const [key, value] = awaitedPairs[i];
                    if (shared_1.isDev || !shared_1.disableValidation) {
                        if (E.isLeft(key)) {
                            error = error ? mergeErrors(error, key.left) : key.left;
                        }
                        if (E.isLeft(value)) {
                            error = error ? mergeErrors(error, value.left) : value.left;
                        }
                    }
                    if (E.isRight(key) && E.isRight(value)) {
                        extractedPairs.push([key.right, value.right]);
                    }
                    if (i % 100 === 0) {
                        yield Promise.resolve();
                    }
                }
                if (error) {
                    return E.left(error);
                }
                return E.right(new Map(extractedPairs));
            });
        }
    };
};
exports.fromMap = fromMap;
const map = (k, a) => function_1.pipe(exports.UnknownRecord, TD.compose(exports.fromMap(k, a)));
exports.map = map;
const toSet = (values) => new Set(values);
const fromSet = (a) => {
    const d = exports.fromArray(a);
    return {
        decode: (i) => function_1.pipe(d.decode(i), TE.map(toSet))
    };
};
exports.fromSet = fromSet;
const set = (a) => exports.fromSet(a);
exports.set = set;
const fromNonEmptyArray = (item) => {
    return TD.compose(exports.fromRefinement(Array_1.isNonEmpty, 'NonEmptyArray<A>'))(exports.fromArray(item));
};
exports.fromNonEmptyArray = fromNonEmptyArray;
const nonEmptyArray = (item) => exports.fromNonEmptyArray(item);
exports.nonEmptyArray = nonEmptyArray;
exports.lazy = TD.lazy;
