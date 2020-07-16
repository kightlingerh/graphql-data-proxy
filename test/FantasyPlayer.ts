import {none, some} from 'fp-ts/lib/Option';
import {make} from '../src/cache/Cache';
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
	}
)


const FantasyPlayerStatisticsQueryVariables = {
	statisticIds: N.array(N.staticString)
}

const FantasyPlayerFantasyInfo = N.type(
	'FantasyPlayerFantasyInfo',
	{
		ownerFantasyTeamId: N.option(N.staticString)
	}
)

const FantasyPlayerInfo = N.sum(FantasyPlayerPersonalInfo, FantasyPlayerFantasyInfo)()

const FantasyPlayerStatisticsMap = N.nonEmptyArray(N.option(N.staticFloat), FantasyPlayerStatisticsQueryVariables);
// 	N.map(
// 	N.staticInt,
// 	N.map(N.staticString, N.option(N.staticFloat)),
// 	FantasyPlayerStatisticsQueryVariables
// )

const FantasyPlayer = N.schema('FantasyPlayer', {
	id: FantasyPlayerId,
	info: FantasyPlayerInfo,
	statistics: FantasyPlayerStatisticsMap,
	personalInfo: FantasyPlayerPersonalInfo,
	fantasyInfo: FantasyPlayerFantasyInfo
});

const FantasyPlayerRequest = N.pickFromType(FantasyPlayer, 'id', 'statistics');

interface FantasyPlayerRequestVariables extends N.TypeOfMergedVariables<typeof FantasyPlayerRequest> {};

export const RequestVariables: FantasyPlayerRequestVariables = {
	statisticIds: ['some-statistic-ids']
};

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

