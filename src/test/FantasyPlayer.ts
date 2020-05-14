import { some } from 'fp-ts/lib/Option'
import * as M from '../model/Model'
import * as C from '../cache/CacheNode'

const FantasyPlayerId = C.scalar('FantasyPlayerId', M.string)

const Date = C.scalar('SerialDate', M.string)

const FantasyPlayerPersonalInfo = C.type('FantasyPlayerPersonalInfo', {
	pictureUrl: C.option(C.staticString),
	firstName: C.array(C.staticString)
})

const FantasyPlayerFantasyInfo = C.type('FantasyPlayerFantasyInfo', {
	ownerFantasyTeamId: C.staticString
})

type FantasyPlayerFantasyInfoStore = typeof FantasyPlayerFantasyInfo['store']

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: C.array(C.staticString)
}

const FantasyPlayerInfoUnion = C.sum({
	fantasyPlayerFantasyInfo: FantasyPlayerFantasyInfo,
	fantasyPlayerPersonalInfo: FantasyPlayerPersonalInfo
})

const FantasyPlayerStatistics = C.map(C.staticNumber, FantasyPlayerPersonalInfo)

const FantasyPlayerStatisticsMap = C.map(
	C.staticNumber,
	FantasyPlayerPersonalInfo,
	FantasyPlayerStatisticsQueryVariables
)

type FantasyPlayerStatisticsMapModel = typeof FantasyPlayerStatisticsMap

const FantasyPlayer = C.schema({
	id: FantasyPlayerId,
	personalInfo: FantasyPlayerPersonalInfo,
	statistics: FantasyPlayerStatisticsMap
})

type Response = M.TypeOf<typeof FantasyPlayer['model']>

type Store = Exclude<typeof FantasyPlayer['__refType'], undefined>


x.write(undefined, {
	id: 'test',
	personalInfo: {
		firstName: 'test',
		pictureUrl: some('')
	},
	statistics: new Map()
})
