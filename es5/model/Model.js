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
exports.useIdentityDecoder = exports.useDecoder = exports.eqById = exports.useEq = exports.encodeById = exports.useIdentityEncoder = exports.useEncoder = exports.lazy = exports.fromTuple = exports.sum = exports.fromSum = exports.nullable = exports.either = exports.fromEither = exports.optionBoolean = exports.optionNumber = exports.optionString = exports.option = exports.fromOption = exports.set = exports.fromSet = exports.map = exports.fromMap = exports.nonEmptyArray = exports.fromNonEmptyArray = exports.array = exports.fromArray = exports.partial = exports.fromPartial = exports.type = exports.fromType = exports.literal = exports.boolean = exports.float = exports.int = exports.number = exports.string = void 0;
const Eq_1 = require("fp-ts/Eq");
const EQ = __importStar(require("./Eq"));
const EN = __importStar(require("./Encoder"));
const TD = __importStar(require("./TaskDecoder"));
const G = __importStar(require("./Guard"));
const function_1 = require("fp-ts/function");
exports.string = {
    equals: EQ.string.equals,
    is: G.string.is,
    decode: TD.string.decode,
    encode: EN.string.encode
};
exports.number = {
    equals: EQ.number.equals,
    is: G.number.is,
    decode: TD.number.decode,
    encode: EN.number.encode
};
exports.int = {
    equals: EQ.int.equals,
    is: G.int.is,
    decode: TD.int.decode,
    encode: EN.int.encode
};
exports.float = {
    equals: EQ.float.equals,
    is: G.float.is,
    decode: TD.float.decode,
    encode: EN.float.encode
};
exports.boolean = {
    equals: EQ.boolean.equals,
    is: G.boolean.is,
    decode: TD.boolean.decode,
    encode: EN.boolean.encode
};
function literal(...values) {
    return {
        equals: Eq_1.eqStrict.equals,
        is: G.literal(...values).is,
        decode: TD.literal(...values).decode,
        encode: EN.id().encode
    };
}
exports.literal = literal;
function fromType(properties) {
    return {
        equals: EQ.type(properties).equals,
        is: G.type(properties).is,
        decode: TD.fromType(properties).decode,
        encode: EN.type(properties).encode
    };
}
exports.fromType = fromType;
function type(properties) {
    return fromType(properties);
}
exports.type = type;
function fromPartial(properties) {
    return {
        equals: EQ.partial(properties).equals,
        is: G.partial(properties).is,
        decode: TD.fromPartial(properties).decode,
        encode: EN.partial(properties).encode
    };
}
exports.fromPartial = fromPartial;
function partial(properties) {
    return fromPartial(properties);
}
exports.partial = partial;
function fromArray(item) {
    return {
        equals: EQ.array(item).equals,
        is: G.array(item).is,
        decode: TD.fromArray(item).decode,
        encode: EN.array(item).encode
    };
}
exports.fromArray = fromArray;
function array(item) {
    return fromArray(item);
}
exports.array = array;
function fromNonEmptyArray(item) {
    return {
        equals: EQ.nonEmptyArray(item).equals,
        is: G.nonEmptyArray(item).is,
        decode: TD.fromNonEmptyArray(item).decode,
        encode: EN.nonEmptyArray(item).encode
    };
}
exports.fromNonEmptyArray = fromNonEmptyArray;
function nonEmptyArray(val) {
    return fromNonEmptyArray(val);
}
exports.nonEmptyArray = nonEmptyArray;
function fromMap(key, item) {
    return {
        equals: EQ.map(key, item).equals,
        is: G.map(key, item).is,
        decode: TD.fromMap(key, item).decode,
        encode: EN.map(Object.fromEntries)(key, item).encode
    };
}
exports.fromMap = fromMap;
function map(key, item) {
    return fromMap(key, item);
}
exports.map = map;
function fromSet(item) {
    return {
        equals: EQ.set(item).equals,
        is: G.set(item).is,
        decode: TD.fromSet(item).decode,
        encode: EN.set(item).encode
    };
}
exports.fromSet = fromSet;
function set(item) {
    return fromSet(item);
}
exports.set = set;
function fromOption(item, lazy = function_1.constNull) {
    return {
        equals: EQ.option(item).equals,
        is: G.option(item).is,
        decode: TD.fromOption(item).decode,
        encode: EN.option(item, lazy).encode
    };
}
exports.fromOption = fromOption;
function option(item, lazy = function_1.constNull) {
    return fromOption(item, lazy);
}
exports.option = option;
exports.optionString = fromOption(exports.string);
exports.optionNumber = fromOption(exports.number);
exports.optionBoolean = fromOption(exports.boolean);
function fromEither(left, right) {
    return {
        equals: EQ.either(left, right).equals,
        is: G.either(left, right).is,
        encode: EN.either(left, right).encode,
        decode: TD.fromEither(left, right).decode
    };
}
exports.fromEither = fromEither;
function either(left, right) {
    return fromEither(left, right);
}
exports.either = either;
function nullable(item) {
    return {
        equals: EQ.nullable(item).equals,
        is: G.nullable(item).is,
        decode: TD.nullable(item).decode,
        encode: EN.nullable(item).encode
    };
}
exports.nullable = nullable;
function fromSum(tag) {
    const eq = EQ.sum(tag);
    const guard = G.sum(tag);
    const decoder = TD.fromSum(tag);
    const encoder = EN.sum(tag);
    return (members) => ({
        equals: eq(members).equals,
        is: guard(members).is,
        decode: decoder(members).decode,
        encode: encoder(members).encode
    });
}
exports.fromSum = fromSum;
function sum(tag) {
    const s = fromSum(tag);
    return (members) => s(members);
}
exports.sum = sum;
function fromTuple(...members) {
    return {
        equals: EQ.tuple(...members).equals,
        is: G.tuple(...members).is,
        decode: TD.fromTuple(...members).decode,
        encode: EN.tuple(...members).encode
    };
}
exports.fromTuple = fromTuple;
function lazy(id, model) {
    return {
        equals: EQ.lazy(model).equals,
        is: G.lazy(model).is,
        decode: TD.lazy(id, model).decode,
        encode: EN.lazy(model).encode
    };
}
exports.lazy = lazy;
function useEncoder(model) {
    return (encoder) => (Object.assign(Object.assign({}, model), { encode: encoder.encode }));
}
exports.useEncoder = useEncoder;
function useIdentityEncoder(model) {
    return useEncoder(model)(EN.id());
}
exports.useIdentityEncoder = useIdentityEncoder;
function encodeById(model) {
    return Object.assign(Object.assign({}, model), { encode: (a) => EN.id().encode(a.id) });
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
function useDecoder(model) {
    return (decoder) => (Object.assign(Object.assign({}, model), { decode: decoder.decode }));
}
exports.useDecoder = useDecoder;
function useIdentityDecoder(model) {
    return useDecoder(model)({
        decode: TD.success
    });
}
exports.useIdentityDecoder = useIdentityDecoder;
