export function isEmptyObject(obj: object): obj is {} {
	return Object.keys(obj).length === 0
}

export function isEmptyString(x: any) {
	return x === ''
}

export const isDev = process?.env?.NODE_ENV !== 'production';

export const disableValidation = process?.env?.DISABLE_VALIDATION !== undefined

