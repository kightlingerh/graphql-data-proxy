import { constUndefined } from 'fp-ts/function'
import * as M from '../model/Model'

export type AnyBaseNode = BaseNode<any, any, any, any, any, any, any, any, any>

export interface BaseNode<
	StrictInput,
	StrictOutput,
	StrictData,
	PartialInput,
	PartialOutput,
	PartialData,
	CacheEntry,
	Variables extends NodeVariables = {},
	SubVariables extends NodeVariables = {}
> {
	readonly tag: string
	readonly strict: M.Model<StrictInput, StrictOutput, StrictData>
	readonly partial: M.Model<PartialInput, PartialOutput, PartialData>
	readonly variables: Variables

	// for internal use
	readonly __hasTransformations: {
		readonly decoding: boolean
		readonly encoding: boolean
	}
	readonly __subVariables?: SubVariables
	readonly __isLocal?: boolean
	readonly __isEntity?: boolean
	readonly __cacheEntry?: CacheEntry
}

export type TypeOf<T> = T extends { readonly strict: M.Model<any, any, infer A> } ? A : never

export type TypeOfStrictInput<T> = T extends { readonly strict: M.Model<infer I, any, any> } ? I : never

export type TypeOfStrictOutput<T> = T extends { readonly strict: M.Model<any, infer O, any> } ? O : never

export type TypeOfPartial<T> = T extends { readonly partial: M.Model<any, any, infer A> } ? A : never

export type TypeOfPartialInput<T> = T extends { readonly partial: M.Model<infer I, any, any> } ? I : never

export type TypeOfPartialOutput<T> = T extends { readonly partial: M.Model<any, infer O, any> } ? O : never

export type ExtractVariablesDefinition<T> = T extends { readonly variables: Record<string, AnyBaseNode> }
	? T['variables']
	: never

export type ExtractNodeDefinitionType<T> = T extends Record<string, AnyBaseNode>
	? { [K in keyof T]: TypeOf<T[K]> }
	: never

export type TypeOfVariables<T> = ExtractNodeDefinitionType<ExtractVariablesDefinition<T>>

export type ExtractSubVariablesDefinition<T> = T extends { readonly __subVariables?: Record<string, AnyBaseNode> }
	? Exclude<T['__subVariables'], undefined>
	: never

export type TypeOfSubVariables<T> = ExtractNodeDefinitionType<ExtractSubVariablesDefinition<T>>

export type TypeOfCacheEntry<T> = T extends { readonly __cacheEntry?: infer A } ? Exclude<A, undefined> : never

export type TypeOfMergedVariables<T> = TypeOfSubVariables<T> & TypeOfVariables<T>

export type ExtractMergedVariablesDefinition<T> = ExtractSubVariablesDefinition<T> & ExtractVariablesDefinition<T>

export interface StaticNodeConfig<
	PartialData,
	CacheEntry,
	MergedVariables extends NodeVariables = {},
	IsLocal extends boolean = false
> {
	readonly variables?: Record<string, AnyBaseNode>
	readonly isLocal?: IsLocal
	readonly isEntity?: boolean
	readonly useCustomCache?: CustomCache<
		PartialData,
		{ [K in keyof MergedVariables]: TypeOf<MergedVariables[K]> },
		CacheEntry
	>
}

export interface DynamicNodeConfig<
	Variables extends NodeVariables,
	PartialData,
	CacheEntry,
	SubVariables extends NodeVariables = {},
	IsLocal extends boolean = false
> extends StaticNodeConfig<PartialData, CacheEntry, SubVariables & Variables, IsLocal> {
	readonly variables: Variables
}

export type NodeVariables = Record<string, AnyBaseNode>
export type Path = Array<string | number>

export interface CustomCache<PartialData, Variables, CacheEntry> {
	(path: Path, variables: Variables, data?: PartialData): CacheEntry | undefined | null
}

export const EMPTY_VARIABLES: any = {}

export const EMPTY_VARIABLES_MODEL = M.type({})

export function extractMemberStrictModels<MS extends Record<string, AnyBaseNode>>(
	members: MS
): { [K in keyof MS]: MS[K]['strict'] } {
	const x: any = Object.create(null)
	for (const key in members) {
		x[key as keyof MS] = members[key as keyof MS].strict
	}
	return x
}

export function extractMemberPartialModels<MS extends Record<string, AnyBaseNode>>(
	members: MS
): { [K in keyof MS]: MS[K]['partial'] } {
	const x: any = Object.create(null)
	for (const key in members) {
		x[key as keyof MS] = members[key as keyof MS].partial
	}
	return x
}

export const NO_TRANSFORMATIONS = {
	decoding: false,
	encoding: false
}

export function useLocalModel<I, O, A>(model: M.Model<I, O, A>): M.Model<I, undefined, A> {
	return {
		...model,
		encode: constUndefined
	}
}

export type ModifyOutputIfLocal<IsLocal, Output> = IsLocal extends true ? undefined : Output

export type Values<T> = T[keyof T]

export type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

export function getModel(
	model: M.Model<any, any, any>,
	isLocal: boolean,
	useIdEncoder: boolean,
	useIdDecoder: boolean
) {
	if (isLocal) {
		return useLocalModel(model)
	}
	if (__DEV__ || !__DISABLE_VALIDATION__) {
		return model
	}
	if (useIdEncoder && useIdDecoder) {
		return M.useIdentityDecoder(M.useIdentityEncoder(model))
	}
	if (useIdEncoder) {
		return M.useIdentityEncoder(model)
	}
	if (useIdDecoder) {
		return M.useIdentityDecoder(model)
	}
	return model as any
}

export function hasEncodingTransformations(ms: Record<string, AnyBaseNode>): boolean {
	for (const k in ms) {
		if (ms[k]?.__hasTransformations?.encoding) {
			return true
		}
	}
	return false
}

export function hasDecodingTransformations(ms: Record<string, AnyBaseNode>): boolean {
	for (const k in ms) {
		if (ms[k]?.__hasTransformations?.decoding) {
			return true
		}
	}
	return false
}
