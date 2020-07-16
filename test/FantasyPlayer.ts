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

const FantasyPlayerStatisticsMap = N.map(
	N.staticInt,
	N.map(N.staticString, N.option(N.staticFloat)),
	FantasyPlayerStatisticsQueryVariables
)

const FantasyPlayer = N.schema('FantasyPlayer', {
	id: FantasyPlayerId,
	info: FantasyPlayerInfo,
	statistics: FantasyPlayerStatisticsMap,
	personalInfo: FantasyPlayerPersonalInfo,
	fantasyInfo: FantasyPlayerFantasyInfo
});

const FantasyPlayerRequest = N.pickFromType(FantasyPlayer, 'info', 'id');

interface FantasyPlayerRequestVariables extends N.TypeOfMergedVariables<typeof FantasyPlayerRequest> {};

export const RequestVariables: FantasyPlayerRequestVariables = {};

export const RequestData: N.TypeOfPartial<typeof FantasyPlayerRequest> = {
	id: 'some-id',
	info: {
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		highSchool: some('La Canada High School')
	}
}

export const cache = make(FantasyPlayer)({})(FantasyPlayerRequest)

