import {some} from 'fp-ts/lib/Option';
import * as C from '../cache/Cache';
import * as M from '../model/Model';
import * as N from '../schema/Node'

const FantasyPlayerId = N.scalar('FantasyPlayerId', M.string)

const Date = N.scalar('SerialDate', M.string)

const FantasyPlayerPersonalInfo = N.type('FantasyPlayerPersonalInfo', {
	pictureUrl: N.option(N.staticString),
	firstName: N.staticString
})

const FantasyPlayerFantasyInfo = N.type(
	'FantasyPlayerFantasyInfo',
	{
		ownerFantasyTeamId: N.staticString
	}
)

type FantasyPlayerFantasyInfoStore = typeof FantasyPlayerFantasyInfo['store']

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: N.array(N.staticString)
}

const FantasyPlayerInfoUnion = N.sum({
	fantasyPlayerFantasyInfo: FantasyPlayerFantasyInfo,
	fantasyPlayerPersonalInfo: FantasyPlayerPersonalInfo
})

const FantasyPlayerStatistics = N.map(N.staticNumber, FantasyPlayerPersonalInfo)

const FantasyPlayerStatisticsMap = N.map(N.staticNumber, N.staticNumber, FantasyPlayerStatisticsQueryVariables)

type FantasyPlayerStatisticsMapModel = typeof FantasyPlayerStatisticsMap

const FantasyPlayer = N.schema({
	id: FantasyPlayerId,
	personalInfo: FantasyPlayerPersonalInfo,
	statistics: FantasyPlayerStatisticsMap
})

type Response = M.TypeOf<typeof FantasyPlayer['model']>

type Store = typeof FantasyPlayer['store']

let x: C.Cache<typeof FantasyPlayer> = 1 as any;

x.write({ statisticIds: [''] }, {
	id: 'test',
	personalInfo: {
		firstName: 'test',
		pictureUrl: some('')
	},
	statistics: new Map()
})
