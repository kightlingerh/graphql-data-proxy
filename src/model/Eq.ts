import {getEq as getEqEither} from 'fp-ts/Either';
import {Eq} from 'fp-ts/lib/Eq';
import {getEq as getEqOption} from 'fp-ts/Option';
import {getEq as getEqMap} from 'fp-ts/Map';
import { getEq as getEqSet } from 'fp-ts/Set';
import * as EQ from 'io-ts/Eq';
import {Float, Int} from './Guard';
export * from 'io-ts/Eq';

export const int: Eq<Int> = EQ.number;

export const float: Eq<Float> = EQ.number;

export const option = getEqOption;

export const either = getEqEither;

export const map = getEqMap;

export const set = getEqSet;
