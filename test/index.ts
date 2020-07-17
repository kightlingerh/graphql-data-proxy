import { chain, chainFirst, fold, fromEither, rightIO } from 'fp-ts/lib/IOEither'
import { pipe } from 'fp-ts/lib/pipeable'
import { draw } from 'io-ts/lib/Tree'
import {cache, FantasyPlayerRequestData, FantasyPlayerRequestVariables} from './Evict'


function test() {
	const newCache: any = cache;
	const evict = newCache.right.write(FantasyPlayerRequestVariables)(FantasyPlayerRequestData)()
	console.log(newCache.right.read(FantasyPlayerRequestVariables)())
	evict();
	console.log(newCache.right.read(FantasyPlayerRequestVariables)())
}

test()


