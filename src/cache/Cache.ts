import { IO } from 'fp-ts/lib/IO'
import { TypeOf } from '../model'
import { Node, Schema } from '../schema'
import {Ref} from '../shared';

export interface Cache<S extends Schema<any>> {
	write(data: ExtractModelType<S>): IO<Evict<void>>
	read(variables: ExtractVariables<S>): IO<ExtractModelType<S>>
	toRefs(variables: ExtractVariables<S>): IO<S['store']>
	toRef(variables: ExtractVariables<S>): IO<Ref<ExtractModelType<S>>>
}

interface Evict<T> extends IO<T> {}

type ExtractModelType<T> = T extends Node ? TypeOf<T['model']> : never

type ExtractVariables<T> = T extends Schema<infer A> ? { [K in keyof A]: TypeOf<A[K]['model']> } : never

export interface OfRef {
	<T>(value?: T): Ref<T>;
}

export function cache<S extends Schema<any>>(schema: S, of: OfRef): Cache<S> {

}
