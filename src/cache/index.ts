import {SchemaNode} from '../schema/Node';

interface ofRef<T> {
	(a: T): Ref<T>;
}

interface Ref<T> {
	value: T;
}

export function make<S extends SchemaNode<any>, R extends ofRef<any>>(schema: S, of: R) {

}
