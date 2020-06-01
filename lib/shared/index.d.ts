import { Lazy } from 'fp-ts/lib/function';
import { Option } from 'fp-ts/lib/Option';
export declare function isEmptyObject(obj: object): obj is {};
export declare function once<T>(fn: Lazy<T>): Lazy<T>;
export declare const constEmptyString: Lazy<string>;
export interface Ref<T> {
    value: Option<T>;
}
export declare function isFunction(u: unknown): u is Function;
