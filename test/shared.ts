import { none, some } from 'fp-ts/lib/Option'
import * as M from '../src/model/Model'
import * as N from '../src/node/index'

export const IdNode = N.scalar('Id', M.string)

export const PersonalInfoNode = N.type('PersonalInfo', {
	pictureUrl: N.option(N.staticString),
	firstName: N.staticString,
	lastName: N.staticString,
	siblings: N.array(N.staticString),
	parents: N.nonEmptyArray(N.staticString),
	highSchool: N.option(N.staticString)
})

export const StatisticsNode = N.map(N.staticString, N.option(N.staticFloat), {
	statisticIds: N.nonEmptyArray(N.staticString)
})

export const PersonNode = N.type('Person', {
	id: IdNode,
	personalInfo: PersonalInfoNode,
	statistics: StatisticsNode
})

export const PeopleNode = N.type('People', {
	allPeople: N.map(IdNode, PersonNode),
	people: N.map(IdNode, PersonNode, {
		ids: N.nonEmptyArray(IdNode)
	})
})

export const Person1: N.TypeOf<typeof PersonNode> = {
	id: '1',
	personalInfo: {
		pictureUrl: none,
		firstName: 'Harry',
		lastName: 'Kightlinger',
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
	personalInfo: {
		pictureUrl: some('url'),
		firstName: 'Sam',
		lastName: 'Baldwin',
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
	personalInfo: Person2.personalInfo,
	statistics: Person2.statistics
}

export const Person2CompleteUpdate: N.TypeOfPartial<typeof PersonNode> = {
	personalInfo: Person1.personalInfo,
	statistics: Person2.statistics
}
