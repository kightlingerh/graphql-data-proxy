import {Cache} from '../cache/Cache';
import { Query } from '../request/Query'
import { array, literal, number, string } from '../model/Model'
import { typeNode, mapNode, schema, staticNumberNode, staticStringNode } from '../schema/Node'

const FantasyPlayerId = staticStringNode

const Date = staticStringNode

const FantasyPlayerPersonalInfo = typeNode(literal('FantasyPlayerPersonalInfo'), {
	pictureUrl: staticStringNode,
	firstName: staticStringNode,
	lastName: staticStringNode,
	dob: Date,
	height: staticNumberNode,
	weight: staticNumberNode
})

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: array(string)
}

const FantasyPlayerStatistics = mapNode(number, FantasyPlayerPersonalInfo)

const FantasyPlayerStatisticsMap = mapNode(number, mapNode(number, staticNumberNode), FantasyPlayerStatisticsQueryVariables)

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
		__typename: true,
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

const cache: Cache<typeof FantasyPlayer> = {
	id: { value: 'fantasy-player-id-1' },
	number: { value: 1 },
	personalInfo: {
		value: {
			pictureUrl: {
				value: 'test'
			},
			firstName: {
				value: 'Harry',
			},
			lastName: {
				value: 'Kightlinger'
			},
			dob: {
				value: '11-17-1991',
			},
			height: {
				value: 67
			},
			weight: {
				value: 150
			}
		}
	},
	statistics: () => ({
		value: new Map<number, Map<number, number>>()
	})
};
