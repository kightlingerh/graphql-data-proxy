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
exports.nonEmptyArray = exports.set = exports.map = exports.either = exports.option = exports.float = exports.int = exports.number = exports.boolean = exports.string = void 0;
const Either_1 = require("fp-ts/lib/Either");
const function_1 = require("fp-ts/lib/function");
const Option_1 = require("fp-ts/lib/Option");
const EN = __importStar(require("io-ts/Encoder"));
__exportStar(require("io-ts/Encoder"), exports);
exports.string = EN.id();
exports.boolean = EN.id();
exports.number = EN.id();
exports.int = EN.id();
exports.float = EN.id();
function option(item, lazy) {
    return {
        encode: Option_1.fold(lazy !== null && lazy !== void 0 ? lazy : function_1.constNull, item.encode)
    };
}
exports.option = option;
const either = (l, r) => ({
    encode: Either_1.fold(l.encode, r.encode)
});
exports.either = either;
const map = (fromPairs) => (k, a) => ({
    encode: (i) => {
        const pairs = [];
        for (const [key, value] of i.entries()) {
            pairs.push([k.encode(key), a.encode(value)]);
        }
        return fromPairs(pairs);
    }
});
exports.map = map;
const set = (item) => ({
    encode: (i) => {
        const values = [];
        i.forEach((value) => {
            values.push(item.encode(value));
        });
        return values;
    }
});
exports.set = set;
const nonEmptyArray = (item) => EN.array(item);
exports.nonEmptyArray = nonEmptyArray;
