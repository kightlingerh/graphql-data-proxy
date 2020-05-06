import { some } from 'fp-ts/lib/Option'
import { Cache } from '../cache/Cache'
import { Query } from '../request/Query'
import {array, literal, number, optionString, string, sum, type, TypeOf} from '../model/Model'
import {
	typeNode,
	mapNode,
	schema,
	staticNumberNode,
	staticStringNode,
	sumNode, arrayNode, scalarNode
} from '../schema/Node'

const FantasyPlayerId = staticStringNode

const Date = staticStringNode

const FantasyPlayerPersonalInfo = typeNode(literal('FantasyPlayerPersonalInfo'), {
	pictureUrl: staticStringNode,
	firstName: staticStringNode
})

type Info = (typeof FantasyPlayerPersonalInfo)['model'];

const FantasyPlayerFantasyInfo = typeNode(literal('FantasyPlayerFantasyInfo'), {
	ownerFantasyTeamId: staticStringNode
}, { fantasyLeagueIds: arrayNode(scalarNode('FantasyLeagueId', string)) })

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: arrayNode(staticStringNode)
}

const FantasyPlayerInfoUnion = sumNode({
	fantasyPlayerFantasyInfo: FantasyPlayerFantasyInfo,
	fantasyPlayerPersonalInfo: FantasyPlayerPersonalInfo
})

const FantasyPlayerStatistics = mapNode(number, FantasyPlayerPersonalInfo)

const FantasyPlayerStatisticsMap = mapNode(number, FantasyPlayerPersonalInfo, FantasyPlayerStatisticsQueryVariables)

type FantasyPlayerStatisticsMapModel = (typeof FantasyPlayerStatisticsMap);

const FantasyPlayer = schema({
	id: FantasyPlayerId,
	number: staticNumberNode,
	fantasyInfo: FantasyPlayerFantasyInfo,
	personalInfo: FantasyPlayerPersonalInfo,
	statistics: FantasyPlayerStatisticsMap
})

type Response = TypeOf<(typeof FantasyPlayer)['model']>

type Store = Exclude<(typeof FantasyPlayer)['store'], undefined>

