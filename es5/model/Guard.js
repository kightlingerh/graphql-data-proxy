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
exports.nonEmptyArray = exports.set = exports.map = exports.either = exports.right = exports.left = exports.option = exports.some = exports.none = exports.float = exports.int = void 0;
const Array_1 = require("fp-ts/lib/Array");
const G = __importStar(require("io-ts/Guard"));
__exportStar(require("io-ts/Guard"), exports);
exports.int = {
    is: (u) => G.number.is(u) && Number.isInteger(u)
};
exports.float = {
    is: (u) => G.number.is(u)
};
exports.none = G.type({ _tag: G.literal('None') });
const some = (value) => G.type({
    _tag: G.literal('Some'),
    value
});
exports.some = some;
const option = (value) => G.sum('_tag')({
    None: exports.none,
    Some: exports.some(value)
});
exports.option = option;
const left = (left) => G.type({
    _tag: G.literal('Left'),
    left
});
exports.left = left;
const right = (right) => G.type({
    _tag: G.literal('Right'),
    right
});
exports.right = right;
const either = (l, r) => G.sum('_tag')({
    Left: exports.left(l),
    Right: exports.right(r)
});
exports.either = either;
const map = (k, a) => ({
    is: (u) => {
        if (typeof Map === undefined || !(u instanceof Map)) {
            return false;
        }
        for (const [key, value] of u.entries()) {
            if (!k.is(key) || !a.is(value)) {
                return false;
            }
        }
        return true;
    }
});
exports.map = map;
const set = (item) => ({
    is: (u) => {
        if (typeof Set === undefined || !(u instanceof Set)) {
            return false;
        }
        for (const value of u.values()) {
            if (!item.is(value)) {
                return false;
            }
        }
        return true;
    }
});
exports.set = set;
const nonEmptyArray = (item) => {
    const arr = G.array(item);
    return {
        is: (u) => arr.is(u) && Array_1.isNonEmpty(u)
    };
};
exports.nonEmptyArray = nonEmptyArray;
