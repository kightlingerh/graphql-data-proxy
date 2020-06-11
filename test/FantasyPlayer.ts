import * as M from '../src/model'
import * as N from '../src/node'

const FantasyPlayerId = N.scalar('FantasyPlayerId', M.string)

const FantasyPlayerPersonalInfo = N.type('FantasyPlayerPersonalInfo', {
	pictureUrl: N.option(N.staticString),
	firstName: N.staticString,
	lastName: N.staticString,
	highSchool: N.option(N.staticString)
})

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: N.array(N.staticString)
}

const FantasyPlayerFantasyInfo = N.type(
	'FantasyPlayerFantasyInfo',
	{
		ownerFantasyTeamId: N.option(N.staticString)
	},
	{
		fantasyPlayerIds: N.nonEmptyArray(N.staticString)
	}
)

const FantasyPlayerStatisticsMap = N.map(
	N.staticString,
	FantasyPlayerPersonalInfo,
	FantasyPlayerStatisticsQueryVariables
)

export type FantasyPlayerStatisticsVariables = N.TypeOfVariables<typeof FantasyPlayerFantasyInfo>

export type FantasyPlayerStatistics = N.TypeOf<typeof FantasyPlayerStatisticsMap>

export const FantasyPlayer = N.schema('FantasyPlayer', {
	id: FantasyPlayerId,
	statistics: FantasyPlayerStatisticsMap,
	personalInfo: FantasyPlayerPersonalInfo,
	fantasyInfo: FantasyPlayerFantasyInfo
})

type MergedVariables = N.TypeOfMergedVariables<typeof FantasyPlayer>
