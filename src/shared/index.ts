export function isEmptyObject(obj: object): obj is {} {
	return Object.keys(obj).length === 0
}

export function isEmptyString(x: any) {
	return x === ''
}
