"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const Type_1 = require("./Type");
function schema(__typename, members) {
    return Type_1.type(__typename, members);
}
exports.schema = schema;
