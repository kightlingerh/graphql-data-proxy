import {shallowReactive} from '@vue/reactivity';
import * as N from '../src/node/index';
import {Evict, FantasyPlayerId} from './Evict';

const FANTASY_PLAYER_CACHE = shallowReactive(new Map())

function useFantasyPlayerCache() {
	return FANTASY_PLAYER_CACHE
}

export const Schema = N.schema('Schema', {
	allFantasyPlayers: N.useCustomCache(N.map(FantasyPlayerId, Evict), useFantasyPlayerCache),
	fantasyPlayers: N.useCustomCache(N.map(FantasyPlayerId, Evict, {
		fantasyPlayerIds: N.nonEmptyArray(FantasyPlayerId)
	}), useFantasyPlayerCache)
})
