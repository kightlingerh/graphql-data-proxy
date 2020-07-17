import {isNone, isSome, none, some} from 'fp-ts/lib/Option'
import {make} from '../src/cache/Cache'
import * as M from '../src/model'
import * as N from '../src/node'

export const FantasyPlayerId = N.scalar('FantasyPlayerId', M.string)

export const FantasyPlayerPersonalInfo = N.type('FantasyPlayerPersonalInfo', {
	pictureUrl: N.option(N.staticString),
	firstName: N.staticString,
	lastName: N.staticString,
	highSchool: N.option(N.staticString)
})

export const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: N.array(N.staticString)
}

export const FantasyPlayerFantasyInfo = N.type('FantasyPlayerFantasyInfo', {
	ownerFantasyTeamId: N.option(N.staticString)
})

const FantasyPlayerInfo = N.sum(FantasyPlayerPersonalInfo, FantasyPlayerFantasyInfo)()

const FantasyPlayerStatistics = N.nonEmptyArray(N.option(N.staticFloat), FantasyPlayerStatisticsQueryVariables)
// 	N.map(
// 	N.staticInt,
// 	N.map(N.staticString, N.option(N.staticFloat)),
// 	FantasyPlayerStatisticsQueryVariables
// )

export const Evict = N.type('Evict', {
	id: FantasyPlayerId,
	info: FantasyPlayerInfo,
	statistics: FantasyPlayerStatistics,
	personalInfo: FantasyPlayerPersonalInfo,
	fantasyInfo: FantasyPlayerFantasyInfo
})

export const FantasyPlayerRequest = N.pickFromType(Evict, 'id', 'personalInfo', 'info', 'statistics')

export const FantasyPlayerRequestVariables: N.TypeOfMergedVariables<typeof FantasyPlayerRequest> = {
	statisticIds: ['some-statistic-id']
}

export const FantasyPlayerRequestData: N.TypeOfPartial<typeof FantasyPlayerRequest> = {
	id: 'some-id',
	info: {
		__typename: 'FantasyPlayerPersonalInfo',
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: some('La Canada High School')
	},
	personalInfo: {
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: some('La Canada High School')
	},
	// fantasyInfo: {
	// 	ownerFantasyTeamId: none
	// },
	statistics: [some(1.4)]
}

export const cache = make(Evict)({})(FantasyPlayerRequest)

function evictTest() {
	const newCache: any = cache;
	const evict = newCache.right.write(FantasyPlayerRequestVariables)(FantasyPlayerRequestData)()
	const readValue = newCache.right.read(FantasyPlayerRequestVariables)()
	if (isNone(readValue)) {
		console.log('failed to read value');
		return
	}
	evict();
	const newReadValue = newCache.right.read(FantasyPlayerRequestVariables)();
	if (isSome(newReadValue)) {
		console.log('failed to evict write');
		return
	}
	console.log('eviction test passed')
}

// console.log(
// 	pipe(
// 		fromEither(cache),
// 		chainFirst((c) => {
// 			const x = c.write(FantasyPlayerRequestVariables)(FantasyPlayerRequestData)
// 			x()();
// 			return rightIO(x);
// 		}),
// 		chain((c) => rightIO(c.read(FantasyPlayerRequestVariables))),
// 		fold(
// 			(e) => () => draw(e),
// 			(data: any) => () => data //data.value.statistics.get(0) as any
// 		)
// 	)()
// )
