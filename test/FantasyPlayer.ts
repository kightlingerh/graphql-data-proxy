import * as M from '../src/model/Model'
import * as N from '../src/node'
import * as D from '../src/document/DocumentNode'

const FantasyPlayerId = N.scalar('FantasyPlayerId', M.string)

const FantasyPlayerPersonalInfo = N.type('FantasyPlayerPersonalInfo', {
	pictureUrl: N.option(N.staticString),
	firstName: N.array(N.staticString)
})

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: D.array(D.staticString)
}

const FantasyPlayerFantasyInfo = N.type(
	'FantasyPlayerFantasyInfo',
	{
		ownerFantasyTeamId: N.option(N.staticString)
	},
	FantasyPlayerStatisticsQueryVariables
)

const FantasyPlayerStatisticsMap = N.map(N.staticNumber, FantasyPlayerFantasyInfo)


export const FantasyPlayer = N.type('FantasyPlayer', {
	id: FantasyPlayerId,
	statistics: FantasyPlayerStatisticsMap,
	personalInfo: FantasyPlayerPersonalInfo,
	fantasyInfo: FantasyPlayerFantasyInfo
})
