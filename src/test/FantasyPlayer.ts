import { Query } from '../request/Query'
import { array, number, string } from '../schema/Model'
import { interfaceNode, mapNode, schema, staticNumberNode, staticStringNode } from '../schema/Node'

const FantasyPlayerId = staticStringNode

const Date = staticStringNode

const FantasyPlayerPersonalInfo = interfaceNode({
	pictureUrl: staticStringNode,
	firstName: staticStringNode,
	lastName: staticStringNode,
	dob: Date,
	height: staticStringNode,
	weight: staticStringNode
})

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: array(string)
}

const FantasyPlayerStatistics = mapNode(number, FantasyPlayerPersonalInfo)

const FantasyPlayerStatisticsMap = mapNode(number, FantasyPlayerStatistics, FantasyPlayerStatisticsQueryVariables)

const FantasyPlayer = schema({
	id: FantasyPlayerId,
	number: staticNumberNode,
	personalInfo: FantasyPlayerPersonalInfo,
	statistics: FantasyPlayerStatisticsMap
})

const tag = FantasyPlayer.tag

const members = FantasyPlayer.members

const query: Query<typeof FantasyPlayer> = {
	id: true,
	personalInfo: {
		pictureUrl: true,
		firstName: true,
		dob: true
	},
	statistics: {
		__variables: {
			statisticIds: [1]
		},
		dob: true
	}
}
