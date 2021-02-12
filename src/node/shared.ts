import { constUndefined } from 'fp-ts/lib/function'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option } from 'fp-ts/lib/Option'
import { Ref as R } from 'vue'
import { Eq } from '../model/Eq';
import { Encoder } from '../model/Encoder';
import * as M from '../model/Model'

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
> extends Partial<Encoder<StrictInput, StrictData>>, Partial<Eq<StrictData>> {
	readonly tag: string
	// readonly strict: M.Model<StrictInput, StrictOutput, StrictData>
	// readonly partial: M.Model<PartialInput, PartialOutput, PartialData>
	readonly variables: Variables

	// for internal use
	readonly __hasDecodingTransformations: boolean
	readonly __hasEncodingTransformations: boolean
	readonly __strictInput?: StrictInput
	readonly __strictOutput?: StrictOutput
	readonly __strictData?: StrictData
	readonly __partialInput?: PartialInput
	readonly __partialOutput?: PartialOutput
	readonly __partialData?: PartialData
	readonly __refs?: Refs
	readonly __subVariables?: SubVariables
	readonly __isLocal?: boolean
	readonly __isEntity?: boolean
	readonly __cacheEntry?: CacheEntry
}

export type TypeOf<T> = T extends { readonly __strictData?: infer A } ? Exclude<A, undefined> : never

export type TypeOfStrictInput<T> = T extends { readonly __strictInput?: infer I } ? Exclude<I, undefined> : never

export type TypeOfStrictOutput<T> = T extends { readonly __strictOutput?: infer O } ? Exclude<O, undefined> : never

export type TypeOfPartial<T> = T extends { readonly __partialData?: infer A } ? Exclude<A, undefined> : never

export type TypeOfPartialInput<T> = T extends { readonly __partialInput?: infer I } ? Exclude<I, undefined> : never

export type TypeOfPartialOutput<T> = T extends { readonly __partialOutput?: infer O } ? Exclude<O, undefined> : never

export type ExtractVariablesDefinition<T> = T extends { readonly variables: infer V } ? V : never

type IsNonEmptyObject<T> = keyof T extends never ? true : false

export type EncodedVariables = string

export type CacheNode<T> = IsNonEmptyObject<ExtractVariablesDefinition<T>> extends true
	? Map<EncodedVariables, TypeOfCacheEntry<T>>
	: TypeOfCacheEntry<T>

export type ExtractNodeDefinitionType<T> = T extends Record<string, AnyBaseNode>
	? { [K in keyof T]: TypeOf<T[K]> }
	: never

export type ExtractNodeDefinitionOutput<T> = T extends Record<string, AnyBaseNode>
	? { [K in keyof T]: TypeOfStrictOutput<T[K]> }
	: never

export type ExtractNodeDefinitionInput<T> = T extends Record<string, AnyBaseNode>
	? { [K in keyof T]: TypeOfStrictInput<T[K]> }
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

export type Values<T> = T[keyof T]

export type Intersection<T> = (T extends unknown ? (x: T) => 0 : never) extends (x: infer R) => 0 ? R : never

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

export function useLocalModel<I, O, A>(model: M.Model<I, O, A>): M.Model<I, undefined, A> {
	return {
		...model,
		encode: constUndefined
	}
}

export function useAdjustedModel(
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
		if (ms[k]?.__hasEncodingTransformations) {
			return true
		}
	}
	return false
}

export function hasDecodingTransformations(ms: Record<string, AnyBaseNode>): boolean {
	for (const k in ms) {
		if (ms[k]?.__hasDecodingTransformations) {
			return true
		}
	}
	return false
}
