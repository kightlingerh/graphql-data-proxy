import * as A from 'fp-ts/lib/Array';
import * as EQ from 'fp-ts/lib/Eq';
import { constant, constNull, flow } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import * as C from 'io-ts/lib/Codec';
import * as E from 'io-ts/lib/Encoder';
import * as G from 'io-ts/lib/Guard';
import * as O from 'fp-ts/lib/Option';
import * as EITHER from 'fp-ts/lib/Either';
import * as M from 'fp-ts/lib/Map';
import * as D from 'io-ts/lib/Decoder';
import * as NE from 'fp-ts/lib/NonEmptyArray';
import * as S from 'fp-ts/lib/Set';
export const string = Object.assign({ equals: EQ.eqString.equals, is: G.string.is }, C.string);
export const number = Object.assign({ equals: EQ.eqNumber.equals, is: G.number.is }, C.number);
export const boolean = Object.assign({ equals: EQ.eqBoolean.equals, is: G.boolean.is }, C.boolean);
export function type(members) {
    return Object.assign({ equals: EQ.getStructEq(members).equals, is: G.type(members).is }, C.type(members));
}
export function partial(members) {
    return Object.assign({ equals: (x, y) => {
            for (const k in members) {
                const xk = x[k];
                const yk = y[k];
                if (!(xk === undefined || yk === undefined ? xk === yk : members[k].equals(xk, yk))) {
                    return false;
                }
            }
            return true;
        }, is: G.partial(members).is }, C.partial(members));
}
export function intersection(left, right) {
    return Object.assign({ equals: (x, y) => left.equals(x, y) && right.equals(x, y), is: G.intersection(left, right).is }, C.intersection(left, right));
}
export function union(...members) {
    return Object.assign({ equals: (x, y) => {
            return members.filter((m) => m.is(x) && m.is(y)).some((m) => m.equals(x, y));
        }, is: G.union(...members).is, encode: (a) => {
            return pipe(members.filter((m) => m.is(a)), A.head, O.fold(constant(JSON.stringify(a)), (m) => m.encode(a)));
        } }, D.union(...members));
}
export function typeWithUniqueIdentifier(properties, key) {
    const keyModel = properties[key];
    return Object.assign(Object.assign({}, type(properties)), { equals: (x, y) => keyModel.equals(x[key], y[key]) });
}
export function nonEmptyArray(val) {
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
                return isNotEmpty(r)
                    ? D.success(r)
                    : D.failure(`expected non empty array but received ${JSON.stringify(u)}`);
            }
        }
    };
}
export function array(val) {
    return Object.assign({ equals: A.getEq(val).equals, is: G.array(val).is }, C.array(val));
}
const UnknownRecordGuard = {
    is: (u) => Object.prototype.toString.call(u) === '[object Object]'
};
const UnknownRecordDecoder = D.fromGuard(UnknownRecordGuard, 'stringNode | number');
export function map(key, value) {
    return {
        equals: M.getEq(key, value).equals,
        encode: getMapEncoder(key, value).encode,
        decode: getMapDecoder(key, value).decode,
        is: getMapGuard(key, value).is
    };
}
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
function getMapDecoder(key, value) {
    return {
        decode: (u) => {
            const v = UnknownRecordDecoder.decode(u);
            if (EITHER.isLeft(v)) {
                return v;
            }
            else {
                const r = v.right;
                const m = new Map();
                const errors = [];
                for (const [k, v] of Object.entries(r)) {
                    const decodedKey = key.decode(k);
                    const decodedValue = value.decode(v);
                    if (EITHER.isLeft(decodedKey)) {
                        errors.push(D.tree(`invalid key supplied ${JSON.stringify(k)}`, decodedKey.left));
                    }
                    if (EITHER.isLeft(decodedValue)) {
                        errors.push(D.tree(`invalid value supplied ${JSON.stringify(v)}`, decodedValue.left));
                    }
                    if (EITHER.isRight(decodedKey) && EITHER.isRight(decodedValue)) {
                        m.set(decodedKey.right, decodedValue.right);
                    }
                }
                return isNotEmpty(errors) ? EITHER.left(errors) : D.success(m);
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
export function set(model) {
    const a = array(model);
    return {
        equals: S.getEq(model).equals,
        encode: flow(setToArray, a.encode),
        decode: flow(a.decode, EITHER.map(arrayToSet)),
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
function setToArray(set) {
    const x = [];
    set.forEach((e) => x.push(e));
    return x;
}
function arrayToSet(a) {
    return new Set(a);
}
function isNotEmpty(as) {
    return as.length > 0;
}
export function option(val, lazy = constNull) {
    return {
        equals: O.getEq(val).equals,
        decode: (u) => (u === null ? EITHER.right(O.none) : pipe(u, val.decode, EITHER.map(O.some))),
        encode: O.fold(lazy, val.encode),
        is: getOptionGuard(val).is
    };
}
const noneGuard = G.type({ _tag: G.literal('None') });
const _tagGuardSum = G.sum('_tag');
function getOptionGuard(guard) {
    return _tagGuardSum({
        None: noneGuard,
        Some: G.type({ _tag: G.literal('Some'), value: guard })
    });
}
export const optionString = option(string);
export const optionNumber = option(number);
export const optionBoolean = option(boolean);
export function sum(tag) {
    return (members) => {
        const equals = (a, b) => {
            for (const key in members) {
                const m = members[key];
                if (m.is(a) && m.is(b)) {
                    return m.equals(a, b);
                }
            }
            return false;
        };
        return {
            equals,
            encode: E.sum(tag)(members).encode,
            is: G.sum(tag)(members).is,
            decode: D.sum(tag)(members).decode
        };
    };
}
export function literal(...values) {
    return {
        equals: EQ.eqStrict.equals,
        is: G.literal(...values).is,
        decode: D.literal(...values).decode,
        encode: E.id.encode
    };
}
