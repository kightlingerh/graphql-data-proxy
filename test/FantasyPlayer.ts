import {none} from 'fp-ts/lib/Option';
import * as M from '../src/model'
import * as N from '../src/node'

const FantasyPlayerId = N.scalar('FantasyPlayerId', M.string)

const FantasyPlayerPersonalInfo = N.type(
	'FantasyPlayerPersonalInfo',
	{
		pictureUrl: N.option(N.staticString),
		firstName: N.staticString,
		lastName: N.staticString,
		highSchool: N.option(N.staticString)
	},
	{ fantasyPlayerIds: N.array(N.staticString) }
)

const PartialFantasyPlayerPersonalInfo = N.omitFromType(FantasyPlayerPersonalInfo, 'pictureUrl')

type Vars = N.TypeOfMergedVariables<typeof PartialFantasyPlayerPersonalInfo>

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: N.array(N.staticString)
}

const FantasyPlayerFantasyInfo = N.type(
	'FantasyPlayerFantasyInfo',
	{
		ownerFantasyTeamId: N.option(N.staticString)
	},
	FantasyPlayerStatisticsQueryVariables
)

const FantasyPlayerInfo = N.sum(FantasyPlayerPersonalInfo, FantasyPlayerFantasyInfo)()

export type Data = N.TypeOf<typeof FantasyPlayerInfo>

const x: Data = {
	__typename: 'FantasyPlayerFantasyInfo',
	ownerFantasyTeamId: none
}

export type MergedVariables = N.TypeOfMergedVariables<typeof FantasyPlayerInfo>

const variables: MergedVariables = {
	fantasyPlayerIds: [],
	statisticIds: [false]
}

const FantasyPlayerStatisticsMap = N.map(
	N.staticInt,
	N.map(N.staticString, N.option(N.staticFloat)),
	FantasyPlayerStatisticsQueryVariables
)

export type FantasyPlayerStatisticsVariables = N.TypeOfVariables<typeof FantasyPlayerFantasyInfo>

export type FantasyPlayerStatistics = N.TypeOf<typeof FantasyPlayerStatisticsMap>

export const FantasyPlayer = N.markAsEntity(
	N.schema('FantasyPlayer', {
		id: FantasyPlayerId,
		statistics: FantasyPlayerStatisticsMap,
		personalInfo: FantasyPlayerPersonalInfo,
		fantasyInfo: FantasyPlayerFantasyInfo
	})
)
