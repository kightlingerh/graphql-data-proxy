import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { IO } from 'fp-ts/lib/IO'
import { Reader } from 'fp-ts/lib/Reader'
import { Task } from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { Monoid } from 'fp-ts/lib/Monoid'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Tree } from 'fp-ts/lib/Tree'
import * as D from '../document/DocumentNode'
import { Ref } from '../shared'

export interface Cache extends Reader<CacheDependencies, Make> {}

export interface Make {
	<R extends D.Schema<any>>(request: R): E.Either<CacheError, CacheProxy<R>>
}

export interface CacheNode<N extends D.Node> extends Reader<CacheNodeDependencies<N>, CacheProxy<N>> {
	
}

export interface CacheProxy<N extends D.Node> {
	write(variables: ExtractMergedVariablesType<N>): Reader<D.ExtractPartialModelType<N>, CacheResult<Evict>>
	read(variables: ExtractMergedVariablesType<N>): CacheResult<D.ExtractModelType<N>>
	toRefs(variables: ExtractMergedVariablesType<N>): CacheResult<D.ExtractRefType<N>>
	toRef(variables: ExtractMergedVariablesType<N>): CacheResult<Ref<D.ExtractModelType<N>>>
}

export interface CacheWriteResult extends CacheResult<Evict> {}

export interface CacheResult<T> extends TE.TaskEither<CacheError, T> {}

export interface Evict extends Task<void> {}

export interface CacheError extends NonEmptyArray<Tree<string>> {}

export type ExtractMergedVariablesType<S extends D.Node> = keyof D.ExtractMergedVariables<S> extends never
	? undefined
	: D.ExtractVariables<D.ExtractMergedVariables<S>>

interface CacheNodeDependencies<T extends D.Node> extends CacheDependencies {
	id: string
	node: T
}

export interface CacheDependencies {
	ofRef: OfRef
	persist?: Persist
}

export interface OfRef {
	<T>(value?: T): Ref<T>
}

export interface Persist {
	store(key: string, value: string): Task<void>
	restore<T>(key: string): Task<O.Option<T>>
}



class StringNode<V extends D.VariablesNode = {}> {

}

abstract class Node<N extends D.Node> {
	protected readonly results: Map<unknown, D.ExtractR
	constructor(protected readonly deps: CacheNodeDependencies<N>) {

	}
}


const cacheWriteResultMonoid: Monoid<CacheWriteResult> = {
	empty: TE.right(taskVoid),
	concat: (x, y) => {
		return (async () => {
			const [xResult, yResult] = await Promise.all([x(), y()])
			if (E.isLeft(xResult) && E.isLeft(yResult)) {
				return E.left([...xResult.left, ...yResult.left] as CacheError)
			} else if (E.isLeft(xResult) && E.isRight(yResult)) {
				yResult.right()
				return xResult
			} else if (E.isLeft(yResult) && E.isRight(xResult)) {
				xResult.right()
				return yResult
			} else if (E.isRight(xResult) && E.isRight(yResult)) {
				return E.right(async () => {
					await Promise.all([x(), y()])
				})
			} else {
				return cacheWriteResultMonoid.empty
			}
		}) as CacheWriteResult
	}
}

async function taskVoid() {}
