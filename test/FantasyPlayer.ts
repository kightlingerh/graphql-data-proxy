import { none, some } from 'fp-ts/lib/Option'
import { make } from '../src/cache/Cache'
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

const FantasyPlayerFantasyInfo = N.type('FantasyPlayerFantasyInfo', {
	ownerFantasyTeamId: N.option(N.staticString)
})

const FantasyPlayerInfo = N.sum(FantasyPlayerPersonalInfo, FantasyPlayerFantasyInfo)()

const FantasyPlayerStatisticsMap = N.nonEmptyArray(N.option(N.staticFloat), FantasyPlayerStatisticsQueryVariables)
// 	N.map(
// 	N.staticInt,
// 	N.map(N.staticString, N.option(N.staticFloat)),
// 	FantasyPlayerStatisticsQueryVariables
// )

const FantasyPlayer = N.markTypeAsUnique(
	N.type('FantasyPlayer', {
		id: FantasyPlayerId,
		info: FantasyPlayerInfo,
		statistics: FantasyPlayerStatisticsMap,
		personalInfo: FantasyPlayerPersonalInfo,
		fantasyInfo: FantasyPlayerFantasyInfo
	}),
	'id'
)

const Schema = N.schema('Schema', {
	allFantasyPlayers: N.map(FantasyPlayerId, FantasyPlayer),
	fantasyPlayers: N.map(FantasyPlayerId, FantasyPlayer, {
		fantasyPlayerIds: N.nonEmptyArray(FantasyPlayerId)
	})
})

const FantasyPlayerRequest = N.pickFromType(FantasyPlayer, 'id', 'fantasyInfo')

const SchemaRequest = N.schema(Schema.__typename, {
	allFantasyPlayers: N.map(FantasyPlayerId, FantasyPlayerRequest),
	fantasyPlayers: N.map(FantasyPlayerId, FantasyPlayerRequest, Schema.members.fantasyPlayers.nodeVariablesDefinition)
})

interface SchemaRequestVariables extends N.TypeOfMergedVariables<typeof SchemaRequest> {}

export const RequestVariables: FantasyPlayerRequestVariables = {
	statisticIds: ['some-statistic-ids']
}

export const RequestData: N.TypeOfPartial<typeof FantasyPlayerRequest> = {
	id: 'some-id',
	// info: {
	// 	__typename: 'FantasyPlayerPersonalInfo',
	// 	pictureUrl: none,
	// 	firstName: 'Harry',
	// 	lastName: 'Kightlinger',
	// 	highSchool: some('La Canada High School')
	// },
	statistics: []
}

export const cache = make(FantasyPlayer)({})(FantasyPlayerRequest)
