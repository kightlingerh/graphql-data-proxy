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
exports.concatEvict = exports.taskVoid = exports.cacheWriteResultMonoid = exports.cacheErrorApplicativeValidation = exports.isFunction = exports.constNone = exports.constMap = exports.constEmptyArray = exports.constEmptyString = exports.isEmptyString = exports.isEmptyObject = void 0;
const function_1 = require("fp-ts/lib/function");
const IOE = __importStar(require("fp-ts/lib/IOEither"));
const NonEmptyArray_1 = require("fp-ts/lib/NonEmptyArray");
const Option_1 = require("fp-ts/lib/Option");
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}
exports.isEmptyObject = isEmptyObject;
function isEmptyString(x) {
    return x === '';
}
exports.isEmptyString = isEmptyString;
exports.constEmptyString = function_1.constant('');
exports.constEmptyArray = function_1.constant([]);
exports.constMap = function_1.constant(new Map());
exports.constNone = function_1.constant(Option_1.none);
function isFunction(u) {
    return typeof u === 'function';
}
exports.isFunction = isFunction;
exports.cacheErrorApplicativeValidation = IOE.getIOValidation(NonEmptyArray_1.getSemigroup());
exports.cacheWriteResultMonoid = {
    empty: function_1.constant(function_1.constVoid),
    concat: (x, y) => {
        return () => () => {
            x();
            y();
        };
    }
};
function taskVoid() {
    return __awaiter(this, void 0, void 0, function* () { });
}
exports.taskVoid = taskVoid;
function concatEvict(x, y) {
    return () => {
        x();
        y();
    };
}
exports.concatEvict = concatEvict;
