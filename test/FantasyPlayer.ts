import { none, Option, some } from 'fp-ts/lib/Option'
import * as M from '../src/model'
import * as N from '../src/node'

const FantasyPlayerId = N.scalar('FantasyPlayerId', M.string)

const FantasyPlayerPersonalInfo = N.markAsEntity(
	N.type('FantasyPlayerPersonalInfo', {
		pictureUrl: N.option(N.staticString),
		firstName: N.staticString,
		lastName: N.staticString,
		highSchool: N.option(N.staticString)
	})
)

const PartialFantasyPlayerPersonalInfo = N.pickFromType(FantasyPlayerPersonalInfo, 'pictureUrl')

type Info = N.TypeOfRefs<typeof PartialFantasyPlayerPersonalInfo>

const x: Info = {
	value: some({
		pictureUrl: none as Option<string>,
		firstName: '',
		lastName: '',
		highSchool: none as Option<string>
	})
}

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: N.array(N.staticString)
}

const FantasyPlayerFantasyInfo = N.type('FantasyPlayerFantasyInfo', {
	ownerFantasyTeamId: N.option(N.staticString)
})

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

type MergedVariables = N.TypeOfMergedVariables<typeof FantasyPlayer>
