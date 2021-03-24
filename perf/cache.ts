(global as any).__DEV__ = true;
(global as any).__DISABLE_VALIDATION__ = false;
import * as Benchmark from 'benchmark';
import { isRight } from 'fp-ts/lib/Either';
import * as C from '../src/cache';
import * as N from  '../src/node';
import * as M from '../src/model';
import data from './data.json'

const suite = new Benchmark.Suite();

export const FantasyPlayerPersonalInfoNode = N.type(
	'FantasyPlayerPersonalInfo',
	{
		pictureUrl: N.option(N.staticString),
		firstName: N.staticString,
		lastName: N.staticString,
		dob: N.staticString,
		height: N.staticInt,
		weight: N.staticInt,
		college: N.option(N.staticString),
		highSchool: N.option(N.staticString)
	}
);

export const FantasyHealthStatusCodeNode = N.scalar(
	'FantasyHealthStatusCode',
	M.literal(
		'Healthy',
		'IR',
		'Probable',
		'Questionable',
		'Doubtful',
		'Out',
		'Suspension',
		'IL',
		'DTD',
		'IL7',
		'IL10',
		'IL60',
		'Bereavement',
		'Paternity'
	)
);


export const FantasyAvailabilityNode = N.scalar(
	'FantasyAvailability',
	M.literal('Owned', 'Waivers', 'AuctionWaivers', 'FreeAgent', 'OutsidePlayerPool')
);

export const FantasyPlayerFantasyInfoNode = N.type(
	'FantasyPlayerFantasyInfo',
	{
		ownerFantasyTeamId: N.option(N.staticString),
		isLocked: N.staticBoolean,
		primaryFantasyPositionId: N.staticString,
		eligibleLineupGroupIds: N.nonEmptyArray(N.staticString),
		eligibleFantasyPositionIds: N.nonEmptyArray(N.staticString),
		undroppable: N.staticBoolean,
		inPlayerPool: N.staticBoolean,
		fantasyHealthStatusCode: FantasyHealthStatusCodeNode,
		fantasyAvailability: FantasyAvailabilityNode,
		waiverEnd: N.option(N.staticString)
	},
	{
		isEntity: true
	}
);

export const FantasyPlayerNode = N.type("FantasyPlayer", {
	id: N.staticString,
	fantasyInfo: FantasyPlayerFantasyInfoNode,
	personalInfo: FantasyPlayerPersonalInfoNode
}, {
	toId: (_1, _2, data) => _1[_1.length -1]
})

const AllFantasyPlayersNode = N.map(N.staticString, FantasyPlayerNode)

const QueryNode = N.type('Query', {
	allFantasyPlayers: AllFantasyPlayersNode
})

const SchemaNodeDecoder = N.useStrictNodeDecoder(QueryNode);

const DecodedData = SchemaNodeDecoder.decode(data)

const cache = C.make({})(QueryNode)(QueryNode)

/*
function implementation x 840,120,089 ops/sec ±1.23% (81 runs sampled)
*/

if (isRight(DecodedData) && isRight(cache)) {
	suite
		.add('function implementation', function() {
			cache.right.write(DecodedData.right)
		})
		.on('cycle', function(event: any) {
			// tslint:disable-next-line: no-console
			console.log(String(event.target));
		})
		.run({ async: true })
}

