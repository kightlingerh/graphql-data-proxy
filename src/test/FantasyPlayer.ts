import { some } from 'fp-ts/lib/Option'
import { Cache } from '../cache/Cache'
import { Query } from '../request/Query'
import { array, literal, number, optionString, string, sum, type, TypeOf } from '../model/Model'
import { typeNode, mapNode, schema, staticNumberNode, staticStringNode, sum, array, scalar } from '../schema/Node'

const FantasyPlayerId = staticStringNode

const Date = staticStringNode

const FantasyPlayerPersonalInfo = typeNode(literal('FantasyPlayerPersonalInfo'), {
	pictureUrl: staticStringNode,
	firstName: staticStringNode
})

const FantasyPlayerFantasyInfo = typeNode(
	literal('FantasyPlayerFantasyInfo'),
	{
		ownerFantasyTeamId: staticStringNode
	},
	{ fantasyLeagueIds: array(scalar('FantasyLeagueId', string)) }
)

type FantasyPlayerFantasyInfoStore = typeof FantasyPlayerFantasyInfo['store']

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: array(staticStringNode)
}

const FantasyPlayerInfoUnion = sum({
	fantasyPlayerFantasyInfo: FantasyPlayerFantasyInfo,
	fantasyPlayerPersonalInfo: FantasyPlayerPersonalInfo
})

const FantasyPlayerStatistics = mapNode(number, FantasyPlayerPersonalInfo)

const FantasyPlayerStatisticsMap = mapNode(number, FantasyPlayerPersonalInfo, FantasyPlayerStatisticsQueryVariables)

type FantasyPlayerStatisticsMapModel = typeof FantasyPlayerStatisticsMap

const FantasyPlayer = typeNode(literal('FantasyPlayer'), {
	id: FantasyPlayerId,
	number: staticNumberNode,
	fantasyInfo: FantasyPlayerFantasyInfo,
	personalInfo: FantasyPlayerPersonalInfo,
	statistics: FantasyPlayerStatisticsMap
})

type Response = TypeOf<typeof FantasyPlayer['model']>

type Store = typeof FantasyPlayer['store']
