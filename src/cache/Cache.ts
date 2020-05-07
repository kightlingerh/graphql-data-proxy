import { IO } from 'fp-ts/lib/IO'
import { TypeOf } from '../model'
import { Node, Schema } from '../schema'
import {Ref} from '../shared';

export interface Cache<S extends Schema<any>> {
	write(data: ExtractModelType<S>): IO<Evict<void>>
	read(variables: ExtractVariablesType<S>): IO<ExtractModelType<S>>
	toRefs(variables: ExtractVariablesType<S>): IO<S['store']>
	toRef(variables: ExtractVariablesType<S>): IO<Ref<ExtractModelType<S>>>
}

interface Evict<T> extends IO<T> {}



export interface OfRef {
	<T>(value?: T): Ref<T>;
}

export function cache<S extends Schema<any>>(schema: S, of: OfRef): Cache<S> {

}
