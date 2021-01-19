import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import * as M from '../model/Model'
import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	getModel,
	ModifyOutputIfLocal,
	AnyBaseNode,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput
} from './shared'

export interface NonEmptyArrayNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		Array<TypeOfStrictInput<Item>>,
		ModifyOutputIfLocal<IsLocal, NonEmptyArray<TypeOfStrictOutput<Item>> | undefined>,
		NonEmptyArray<TypeOf<Item>> | undefined,
		Array<TypeOfPartialInput<Item>>,
		ModifyOutputIfLocal<IsLocal, NonEmptyArray<TypeOfPartialOutput<Item>> | undefined>,
		NonEmptyArray<TypeOfPartial<Item>> | undefined,
		NonEmptyArray<TypeOfPartial<Item>> | undefined,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'NonEmptyArray'
	readonly item: Item
	readonly __customCache?: CustomCache<
		NonEmptyArray<TypeOfPartial<Item>> | undefined,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		NonEmptyArray<TypeOfPartial<Item>> | undefined
	>
}

export interface StaticNonEmptyArrayNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean>
	extends StaticNodeConfig<
		NonEmptyArray<TypeOfPartial<Item>> | undefined,
		NonEmptyArray<TypeOfPartial<Item>> | undefined,
		{},
		IsLocal
	> {}

export interface DynamicNonEmptyArrayNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		NonEmptyArray<TypeOfPartial<Item>> | undefined,
		NonEmptyArray<TypeOfPartial<Item>> | undefined,
		{},
		IsLocal
	> {}

const NON_EMPTY_ARRAY_TAG = 'NonEmptyArray'

function getNonEmptyArrayModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return getModel(
		M.fromNonEmptyArray(isStrict ? item.strict : item.partial),
		isLocal,
		item.__hasTransformations.encoding,
		item.__hasTransformations.decoding
	)
}

export function nonEmptyArray<Item extends AnyBaseNode, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticNonEmptyArrayNodeConfig<Item, IsLocal>
): NonEmptyArrayNode<Item, {}, IsLocal>
export function nonEmptyArray<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false>(
	item: Item,
	config: DynamicNonEmptyArrayNodeConfig<Item, Variables, IsLocal>
): NonEmptyArrayNode<Item, Variables, IsLocal>
export function nonEmptyArray<Item extends AnyBaseNode, Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticNonEmptyArrayNodeConfig<Item, IsLocal> | DynamicNonEmptyArrayNodeConfig<Item, Variables, IsLocal>
): NonEmptyArrayNode<Item, Variables, IsLocal> {
	return {
		tag: NON_EMPTY_ARRAY_TAG,
		item,
		strict: getNonEmptyArrayModel(item, !!config?.isLocal, true),
		partial: getNonEmptyArrayModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: item.__hasTransformations,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
