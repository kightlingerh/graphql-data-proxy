import { none, some } from 'fp-ts/lib/Option'
import * as M from '../src/model/Model'
import * as N from '../src/node/index'

export const IdNode = N.scalar('Id', M.string)

export const PersonalInfoNode = N.type('PersonalInfo', {
	pictureUrl: N.option(N.staticString),
	canVote: N.staticBoolean,
	firstName: N.staticString,
	lastName: N.staticString,
	siblings: N.array(N.staticString),
	numberOfSiblings: N.staticInt,
	netWorth: N.staticFloat,
	parents: N.nonEmptyArray(N.staticString),
	highSchool: N.option(N.staticString)
})

export const WorkInfoNode = N.type('WorkInfo', {
	employer: N.option(N.staticString),
	startDate: N.option(N.staticString),
	endDate: N.option(N.staticString)
})

export const StatisticsNode = N.recordMap(N.staticString, N.option(N.staticFloat), {
	variables: {
		statisticIds: N.nonEmptyArray(N.staticString)
	}
})

const InfoNode = N.sum([PersonalInfoNode, WorkInfoNode])

export const PersonNode = N.type('Person', {
	id: IdNode,
	info: InfoNode,
	statistics: StatisticsNode
})

export const PeopleNode = N.schema('Query', {
	allPeople: N.recordMap(IdNode, PersonNode),
	people: N.recordMap(IdNode, PersonNode, {
		variables: {
			ids: N.nonEmptyArray(IdNode)
		}
	})
})

export const Person1: N.TypeOf<typeof PersonNode> = {
	id: '1',
	info: {
		__typename: 'PersonalInfo',
		canVote: true,
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
		numberOfSiblings: 2,
		netWorth: 10.6,
		highSchool: none,
		siblings: ['Desi', 'Elizabeth'],
		parents: ['Barbara', 'Jeff']
	},
	statistics: new Map([
		['1', some(1.4)],
		['2', none]
	])
}

export const Person1Variables: N.TypeOfMergedVariables<typeof PersonNode> = {
	statisticIds: ['1', '2']
}

export const Person2: N.TypeOf<typeof PersonNode> = {
	id: '2',
	info: {
		__typename: 'PersonalInfo',
		canVote: false,
		pictureUrl: some('url'),
		firstName: 'Sam',
		lastName: 'Baldwin',
		numberOfSiblings: 1,
		netWorth: 10.4,
		highSchool: some('La Canada High School'),
		siblings: ['Will'],
		parents: ['Doug', 'Judie']
	},
	statistics: new Map([
		['1', some(1.8)],
		['2', some(5.6)],
		['3', none]
	])
}

export const Person2Variables: N.TypeOfMergedVariables<typeof PersonNode> = {
	statisticIds: ['1', '2', '3']
}

export const Person1CompleteUpdate: N.TypeOfPartial<typeof PersonNode> = {
	info: {
		__typename: 'WorkInfo',
		employer: some('PFM'),
		startDate: some('2014-4-14'),
		endDate: some('2017-4-3')
	},
	statistics: Person2.statistics
}

export const Person2CompleteUpdate: N.TypeOfPartial<typeof PersonNode> = {
	info: {
		firstName: 'Harry',
		lastName: 'Kightlinger'
	},
	statistics: Person1.statistics
}
