import {IO} from 'fp-ts/lib/IO';
import {TypeOf} from '../model';
import {Node, Schema} from '../schema';

export interface Cache<S extends Schema<any>> {
	write(data: ExtractModel<S>): IO<Evict<void>>;
	read(variables: ExtractVariables<S>): IO<ExtractModel<S>>;
	toRefs(variables: ExtractVariables<S>): S['store'];
}

interface Evict<T> extends IO<T> {}

type ExtractModel<T> = T extends Node ? TypeOf<T['model']> : never;

type ExtractVariables<T> = T extends Schema<infer A> ? { [K in keyof A]: TypeOf<A[K]['model']> } : never;
