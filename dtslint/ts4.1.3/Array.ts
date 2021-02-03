import * as N from '../../src/node';

// primitive
const stringArray = N.array(N.staticString)

type TypeOfStringArray = N.TypeOf<typeof stringArray>;

const aString: TypeOfStringArray = ['a'] // no error

const bString: TypeOfStringArray = [5] // $ExpectError


// type
const TypeArray = N.array(N.type('Test', {
	a: N.staticString,
	b: N.staticInt
}));

type TypeOfTypeArray = N.TypeOf<typeof TypeArray>;

const aInt: TypeOfTypeArray = [{a: 'a', b: 1}] // no error

const bInt: TypeOfTypeArray = [{a: 'a', b: 'b'}] // $ExpectError



