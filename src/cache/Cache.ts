import { IO } from 'fp-ts/lib/IO'
import * as N from '../schema/Node';
import {Ref} from '../shared';

export interface Cache<S extends N.Schema<any>> {
	write(data: N.ExtractModelType<S>): IO<Evict<void>>
	read(variables: ExtractVariablesType<S>): IO<N.ExtractModelType<S>>
	toRefs(variables: ExtractVariablesType<S>): IO<S['__cacheType']>
	toRef(variables: ExtractVariablesType<S>): IO<Ref<N.ExtractModelType<S>>>
}

interface Evict<T> extends IO<T> {}

export type ExtractVariablesType<S extends N.Schema<any>> = N.ExtractVariables<S['__mergedVariables']>

export interface OfRef {
	<T>(value?: T): Ref<T>;
}

export function cache<S extends N.Schema<any>>(schema: S, of: OfRef): Cache<S> {

}
