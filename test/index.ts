import {chain, chainFirst, fold, fromEither, rightIO} from 'fp-ts/lib/IOEither';
import {pipe} from 'fp-ts/lib/pipeable';
import {draw} from 'io-ts/lib/Tree';
import {cache, RequestData} from './FantasyPlayer'


console.log(
	pipe(
		fromEither(cache),
		chainFirst(c => rightIO(c.write({})(RequestData))),
		chain(c => rightIO(c.read({}))),
		fold(
			e => () => draw(e),
			data => () => JSON.stringify(data)
		)
	)()
)
