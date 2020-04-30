import { IO } from 'fp-ts/lib/IO'
import { Option } from 'fp-ts/lib/Option'

export interface Cache<T> {
	write(data: T, isOptimistic: boolean): IO<Evict>
	read(includeOptimistic: boolean): IO<Option<T>>
}

export type Evict = IO<void>
