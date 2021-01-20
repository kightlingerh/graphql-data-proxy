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

export interface ArrayNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		Array<TypeOfStrictInput<Item>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfStrictOutput<Item>>>,
		Array<TypeOf<Item>>,
		Array<TypeOfPartialInput<Item>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfPartialOutput<Item>>>,
		Array<TypeOfPartial<Item>>,
		Array<TypeOfPartial<Item>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Array'
	readonly item: Item
	readonly __customCache?: CustomCache<
		Array<TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		Array<TypeOfPartial<Item>>
	>
}

export interface StaticArrayNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean>
	extends StaticNodeConfig<Array<TypeOfPartial<Item>>, Array<TypeOfPartial<Item>>, {}, IsLocal> {}

export interface DynamicArrayNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean
> extends DynamicNodeConfig<Variables, Array<TypeOfPartial<Item>>, Array<TypeOfPartial<Item>>, {}, IsLocal> {}

const ARRAY_TAG = 'Array'

function getArrayModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return getModel(
		M.fromArray(isStrict ? item.strict : item.partial),
		isLocal,
		item.__hasTransformations.encoding,
		item.__hasTransformations.decoding
	)
}

export function array<Item extends AnyBaseNode, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticArrayNodeConfig<Item, IsLocal>
): ArrayNode<Item, {}, IsLocal>
export function array<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false>(
	item: Item,
	config: DynamicArrayNodeConfig<Item, Variables, IsLocal>
): ArrayNode<Item, Variables, IsLocal>
export function array<Item extends AnyBaseNode, Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticArrayNodeConfig<Item, IsLocal> | DynamicArrayNodeConfig<Item, Variables, IsLocal>
): ArrayNode<Item, Variables, IsLocal> {
	return {
		tag: ARRAY_TAG,
		item,
		strict: getArrayModel(item, !!config?.isLocal, true),
		partial: getArrayModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: item.__hasTransformations,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
