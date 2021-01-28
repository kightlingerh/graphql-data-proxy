import { constUndefined } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option } from 'fp-ts/lib/Option'
import { Ref as R } from 'vue'
import * as M from '../model/Model'
import { disableValidation, isDev } from '../shared'

export type AnyBaseNode = BaseNode<any, any, any, any, any, any, any, any, any>

export type Ref<T> = R<T>

export interface BaseNode<
	StrictInput,
	StrictOutput,
	StrictData,
	PartialInput,
	PartialOutput,
	PartialData,
	CacheEntry,
	Variables extends NodeVariables = {},
	SubVariables extends NodeVariables = {},
	Refs = CacheEntry
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
	readonly __refs?: Refs
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

type IsNonEmptyObject<T> = keyof T extends never ? true : false

export type EncodedVariables = string

export type CacheNode<T> = IsNonEmptyObject<ExtractVariablesDefinition<T>> extends true
	? Map<EncodedVariables, TypeOfCacheEntry<T>>
	: TypeOfCacheEntry<T>

export type ExtractNodeDefinitionType<T> = T extends Record<string, AnyBaseNode>
	? { [K in keyof T]: TypeOf<T[K]> }
	: never

export type TypeOfVariables<T> = ExtractNodeDefinitionType<ExtractVariablesDefinition<T>>

export type ExtractSubVariablesDefinition<T> = T extends { readonly __subVariables?: Record<string, AnyBaseNode> }
	? Exclude<T['__subVariables'], undefined>
	: never

export type TypeOfSubVariables<T> = ExtractNodeDefinitionType<ExtractSubVariablesDefinition<T>>

export type TypeOfRefs<T> = T extends { readonly __refs?: infer A } ? Exclude<A, undefined> : never

export type TypeOfCacheEntry<T> = T extends { readonly __cacheEntry?: infer A } ? Exclude<A, undefined> : never

export type TypeOfMergedVariables<T> = TypeOfSubVariables<T> & TypeOfVariables<T>

export type ExtractMergedVariablesDefinition<T> = ExtractSubVariablesDefinition<T> & ExtractVariablesDefinition<T>

export type ModifyOutputIfLocal<IsLocal, Output> = IsLocal extends true ? undefined : Output

export type ModifyIfEntity<IsEntity, Data, CacheEntry> = IsEntity extends true ? Ref<Option<Data>> : CacheEntry

export interface StaticNodeConfig<IsLocal extends boolean = false, IsEntity extends boolean = false> {
	readonly variables?: Record<string, AnyBaseNode>
	readonly isLocal?: IsLocal
	readonly isEntity?: IsEntity
}

export interface DynamicNodeConfig<
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends StaticNodeConfig<IsLocal, IsEntity> {
	readonly variables: Variables
}

export type NodeVariables = Record<string, AnyBaseNode>

export type Path = NonEmptyArray<string | number>

export interface CustomCache<PartialData, Variables> {
	toId: <V extends Record<string, unknown> = Record<string, unknown>>(
		path: Path,
		variables?: Variables & V,
		data?: PartialData
	) => unknown
}

export const EMPTY_VARIABLES: any = {}

export const EMPTY_VARIABLES_MODEL = M.type({})

export function extractStrictModels<MS extends Record<string, AnyBaseNode>>(
	members: MS
): { [K in keyof MS]: MS[K]['strict'] } {
	const x: any = Object.create(null)
	for (const key in members) {
		x[key as keyof MS] = members[key as keyof MS].strict
	}
	return x
}

export function extractPartialModels<MS extends Record<string, AnyBaseNode>>(
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

export const HAS_TRANSFORMATIONS = {
	decoding: true,
	encoding: true
}

export function useLocalModel<I, O, A>(model: M.Model<I, O, A>): M.Model<I, undefined, A> {
	return {
		...model,
		encode: constUndefined
	}
}

export type Values<T> = T[keyof T]

export type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

export function useAdjustedModel(
	model: M.Model<any, any, any>,
	isLocal: boolean,
	useIdEncoder: boolean,
	useIdDecoder: boolean
) {
	if (isLocal) {
		return useLocalModel(model)
	}
	if (isDev || !disableValidation) {
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
