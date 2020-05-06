import { some } from 'fp-ts/lib/Option'
import {Cache} from '../cache/Cache'
import { Query } from '../request/Query'
import { array, literal, number, optionString, string, sum, type } from '../model/Model'
import {
	typeNode,
	mapNode,
	schema,
	staticNumberNode,
	staticStringNode,
	sumNode,
	ExtractCacheType,
	ExtractRequestType
} from '../schema/Node'

const FantasyPlayerId = staticStringNode

const Date = staticStringNode

const FantasyPlayerPersonalInfo = typeNode(literal('FantasyPlayerPersonalInfo'), {
	pictureUrl: staticStringNode,
	firstName: staticStringNode,
})

const FantasyPlayerFantasyInfo = typeNode(literal('FantasyPlayerFantasyInfo'), {
	ownerFantasyTeamId: staticStringNode
})

const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: array(string)
}

const info = sumNode({
	fantasyPlayerFantasyInfo: FantasyPlayerFantasyInfo,
	fantasyPlayerPersonalInfo: FantasyPlayerPersonalInfo
})

const FantasyPlayerStatistics = mapNode(number, FantasyPlayerPersonalInfo)

const FantasyPlayerStatisticsMap = mapNode(number, FantasyPlayerPersonalInfo, FantasyPlayerStatisticsQueryVariables)

type FantasyPlayerStatisticsRequest = ExtractCacheType<typeof FantasyPlayerStatisticsMap>

const FantasyPlayer = schema({
	id: FantasyPlayerId,
	number: staticNumberNode,
	personalInfo: FantasyPlayerPersonalInfo,
	statistics: FantasyPlayerStatisticsMap,

})

type FantasyPlayerCache = ExtractCacheType<typeof FantasyPlayer>

type FantasyPlayerRequest = ExtractRequestType<typeof FantasyPlayer>;

const query: Query<typeof FantasyPlayer> = {
	id: true,
	info: {
		fantasyPlayerFantasyInfo: {
			__typename: true,
			ownerFantasyTeamId: true
		},
		fantasyPlayerPersonalInfo: {
			__typename: true,
			pictureUrl: true
		}
	},
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
	id: { value: some('fantasy-player-id-1') },
	info: {
		pictureUrl: {
			value: some('test')
		},
		firstName: {
			value: some('Harry')
		},
		lastName: {
			value: some('Kightlinger')
		},
		dob: {
			value: some('11-17-1991')
		},
		height: {
			value: some(67)
		},
		weight: {
			value: some(150)
		}
	},
	number: { value: some(1) },
	personalInfo: {
		pictureUrl: {
			value: some('test')
		},
		firstName: {
			value: some('Harry')
		},
		lastName: {
			value: some('Kightlinger')
		},
		dob: {
			value: some('11-17-1991')
		},
		height: {
			value: some(67)
		},
		weight: {
			value: some(150)
		}
	},
	statistics: () => ({
		value: some(new Map())
	})
}

const FantasyPlayerPersonalInfoModel = type({
	__typename: literal('FantasyPlayerPersonalInfo'),
	pictureUrl: string,
	firstName: string,
	lastName: string,
	dob: string,
	height: number,
	weight: number
})

const FantasyPlayerFantasyInfoModel = type({
	__typename: literal('FantasyPlayerFantasyInfo'),
	ownerFantasyTeamId: optionString
})

const sumInfo = sum('__typename')({
	FantasyPlayerPersonalInfo: FantasyPlayerPersonalInfoModel,
	FantasyPlayerFantasyInfo: FantasyPlayerFantasyInfoModel
})
