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
exports.nonEmptyArray = exports.set = exports.map = exports.either = exports.option = exports.float = exports.int = void 0;
const Either_1 = require("fp-ts/lib/Either");
const NonEmptyArray_1 = require("fp-ts/lib/NonEmptyArray");
const Option_1 = require("fp-ts/lib/Option");
const Map_1 = require("fp-ts/lib/Map");
const Set_1 = require("fp-ts/lib/Set");
const EQ = __importStar(require("io-ts/Eq"));
__exportStar(require("io-ts/Eq"), exports);
exports.int = EQ.number;
exports.float = EQ.number;
exports.option = Option_1.getEq;
exports.either = Either_1.getEq;
exports.map = Map_1.getEq;
exports.set = Set_1.getEq;
exports.nonEmptyArray = NonEmptyArray_1.getEq;
