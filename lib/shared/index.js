import { constant } from 'fp-ts/lib/function';
export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}
export function once(fn) {
    let result;
    return () => {
        if (result) {
            return result;
        }
        else {
            result = fn();
            return result;
        }
    };
}
export const constEmptyString = constant('');
export function isFunction(u) {
    return typeof u === 'function';
}
