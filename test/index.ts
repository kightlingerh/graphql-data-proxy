import {chain, chainFirst, fold, fromEither, rightIO} from 'fp-ts/lib/IOEither';
import {isSome} from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/pipeable';
import {draw} from 'io-ts/lib/Tree';
import {cache, RequestData, RequestVariables} from './FantasyPlayer'


console.log(
	pipe(
		fromEither(cache),
		chainFirst(c => rightIO(c.write(RequestVariables)(RequestData))),
		chain(c => rightIO(c.read(RequestVariables))),
		fold(
			e => () => draw(e),
			(data: any) => () => data //data.value.statistics.get(0) as any
		)
	)()
)
