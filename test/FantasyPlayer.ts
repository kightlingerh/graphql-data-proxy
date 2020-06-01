import { some } from 'fp-ts/lib/Option'
import * as M from '../src/model/Model'
import * as C from '../src/node'
import * as D from '../src/document/DocumentNode'

const FantasyPlayerId = C.scalar('FantasyPlayerId', M.string)

const Date = C.scalar('SerialDate', M.string)

const FantasyPlayerPersonalInfo = C.type('FantasyPlayerPersonalInfo', {
	pictureUrl: C.option(C.staticString),
	firstName: C.array(C.staticString)
})

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: D.array(D.staticString)
}

const FantasyPlayerFantasyInfo = C.type(
	'FantasyPlayerFantasyInfo',
	{
		ownerFantasyTeamId: C.staticString
	},
	FantasyPlayerStatisticsQueryVariables
)

const FantasyPlayerInfoUnion = C.sum({
	fantasyPlayerFantasyInfo: FantasyPlayerFantasyInfo,
	fantasyPlayerPersonalInfo: FantasyPlayerPersonalInfo
})

const FantasyPlayerStatistics = C.map(C.staticNumber, FantasyPlayerPersonalInfo)

const FantasyPlayerStatisticsMap = C.map(C.staticNumber, FantasyPlayerFantasyInfo)

type FantasyPlayerStatisticsMapVariables = D.ExtractChildrenVariablesDefinition<typeof FantasyPlayerStatisticsMap>

const FantasyPlayer = C.type('FantasyPlayer', {
	id: FantasyPlayerId,
	statistics: FantasyPlayerStatisticsMap
})

type FantasyPlayerQueryVariables = D.ExtractChildrenVariablesType<typeof FantasyPlayer>

x.write(undefined, {
	id: 'test',
	personalInfo: {
		firstName: 'test',
		pictureUrl: some('')
	},
	statistics: new Map()
})
