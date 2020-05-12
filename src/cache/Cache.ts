import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option';
import {IO} from 'fp-ts/lib/IO';
import {Reader} from 'fp-ts/lib/Reader';
import {Task} from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither'
import { Monoid } from 'fp-ts/lib/Monoid'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Tree } from 'fp-ts/lib/Tree'
import * as N from '../schema/Node'
import { Ref } from '../shared'

export interface Cache extends Reader<CacheDependencies, Make> {};

export interface Make {
	<R extends N.Schema<any>>(request: R): E.Either<CacheError, CacheProxy<R>>
}

export interface CacheProxy<R extends N.Node> {
	write(
		variables: ExtractMergedVariablesType<R>
	): Reader<N.ExtractPartialModelType<R>, CacheResult<Evict>>
	read(
		variables: ExtractMergedVariablesType<R>
	): CacheResult<N.ExtractModelType<R>>
	toRefs(
		variables: ExtractMergedVariablesType<R>
	): CacheResult<N.ExtractRefType<R>>
	toRef(
		variables: ExtractMergedVariablesType<R>
	): CacheResult<Ref<N.ExtractModelType<R>>>
}

interface CacheWriteResult extends CacheResult<Evict> {}

interface CacheResult<T> extends TE.TaskEither<CacheError, T> {}

interface Evict extends Task<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export type ExtractMergedVariablesType<S extends N.Node> = keyof N.ExtractMergedVariables<S> extends never
	? undefined
	: N.ExtractVariables<N.ExtractMergedVariables<S>>

export interface CacheDependencies {
	ofRef: OfRef;
	persist?: Persist
}

export interface OfRef {
	<T>(value?: T): Ref<T>
}

export interface Persist {
	store(key: string, value: string): Task<void>;
	restore<T>(key: string): Task<O.Option<T>>
}

interface CacheNodeParams<T extends N.Node> extends CacheDependencies {
	id: string;
	node: T;
}

 abstract class CacheNode<T extends N.Node> implements CacheProxy<T> {
	 constructor(protected readonly params: CacheNodeParams<T>) {
		 this.write = this.write.bind(this);
		 this.read = this.read.bind(this);
		 this.toRef = this.toRef.bind(this);
		 this.toRefs = this.toRefs.bind(this);
	 }

	 abstract write(variables: ExtractMergedVariablesType<T>): Reader<N.ExtractPartialModelType<T>, CacheResult<Evict>>

	 abstract read(variables: ExtractMergedVariablesType<T>): CacheResult<N.ExtractModelType<T>>

	 abstract toRef(variables: ExtractMergedVariablesType<T>): CacheResult<Ref<N.ExtractModelType<T>>>

	 abstract toRefs(variables: ExtractMergedVariablesType<T>): CacheResult<N.ExtractRefType<T>>

	 protected encodeVariables(variables: ExtractMergedVariablesType<T>): unknown {
	 	return this.params.node.variablesModel.encode(this.extractNodeVariables(variables));
	 }

	 protected extractNodeVariables(
		 variables: ExtractMergedVariablesType<T>
	 ): N.ExtractVariables<T['variables']> {
		 const x: any = {}
		 Object.keys(this.params.node.variables).forEach((key) => {
			 x[key] = variables && variables[key]
		 })
		 return x
	 }

 }


class LiteralCacheNode<T extends N.LiteralNode<any>> extends CacheNode<T> {
	private results: Map<unknown, N.ExtractRefType<T>> = new Map();
	constructor(params: CacheNodeParams<T>) {
		super(params);
	}

	toRef(variables: ExtractMergedVariablesType<T>): CacheResult<Ref<N.ExtractModelType<T>>> {
		return TE.rightIO(this.extractRef(variables));
	}

	toRefs(variables: ExtractMergedVariablesType<T>): CacheResult<ExtractRefType<T>> {
		return undefined;
	}

	private extractRef(variables: ExtractMergedVariablesType<T>): IO<N.ExtractRefType<T>> {
		return () => {
			const encodedVariables = this.encodeVariables(variables);
			const ref = this.results.get(encodedVariables);
			if (ref) {
				return ref;
			} else {
				const newRef = this.params.ofRef() as N.ExtractRefType<T>;
				this.results.set(encodedVariables, newRef);
				return newRef;
			}
		};
	}

}


const cacheWriteResultMonoid: Monoid<CacheWriteResult> = {
	empty: TE.right(taskVoid),
	concat: (x, y) => {
		return (async () => {
			const [xResult, yResult] = await Promise.all([x(), y()]);
			if (E.isLeft(xResult) && E.isLeft(yResult)) {
				return E.left([...xResult.left, ...yResult.left] as CacheError)
			} else if (E.isLeft(xResult) && E.isRight(yResult)) {
				yResult.right()
				return xResult;
			} else if (E.isLeft(yResult) && E.isRight(xResult)) {
				xResult.right()
				return yResult;
			} else if (E.isRight(xResult) && E.isRight(yResult)) {
				return E.right(async () => {
					await Promise.all([x(), y()]);
				})
			} else {
				return cacheWriteResultMonoid.empty
			}
		}) as CacheWriteResult
	}
}

async function taskVoid() {}
