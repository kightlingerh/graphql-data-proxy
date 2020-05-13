import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
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

