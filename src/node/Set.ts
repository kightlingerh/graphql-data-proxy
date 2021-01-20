import * as M from '../model/Model'
import {
	BaseNode,
	CustomCache,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractNodeDefinitionType,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	useAdjustedModel,
	ModifyOutputIfLocal,
	AnyBaseNode,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput, HAS_TRANSFORMATIONS
} from './shared'

export interface SetNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		Array<TypeOfStrictInput<Item>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfStrictOutput<Item>>>,
		Set<TypeOf<Item>>,
		Array<TypeOfPartialInput<Item>>,
		ModifyOutputIfLocal<IsLocal, Array<TypeOfPartialOutput<Item>>>,
		Set<TypeOfPartial<Item>>,
		Set<TypeOfPartial<Item>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Set'
	readonly item: Item
	readonly __customCache?: CustomCache<
		Set<TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		Set<TypeOfPartial<Item>>
	>
}

export interface StaticSetNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean>
	extends StaticNodeConfig<Set<TypeOfPartial<Item>>, Set<TypeOfPartial<Item>>, {}, IsLocal> {}

export interface DynamicSetNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean
> extends DynamicNodeConfig<Variables, Set<TypeOfPartial<Item>>, Set<TypeOfPartial<Item>>, {}, IsLocal> {}

const SET_TAG = 'Set'

function getSetModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(
		M.fromSet(isStrict ? item.strict : item.partial),
		isLocal,
		item.__hasTransformations.encoding,
		item.__hasTransformations.decoding
	)
}

export function set<Item extends AnyBaseNode, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticSetNodeConfig<Item, IsLocal>
): SetNode<Item, {}, IsLocal>
export function set<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false>(
	item: Item,
	config: DynamicSetNodeConfig<Item, Variables, IsLocal>
): SetNode<Item, Variables, IsLocal>
export function set<Item extends AnyBaseNode, Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticSetNodeConfig<Item, IsLocal> | DynamicSetNodeConfig<Item, Variables, IsLocal>
): SetNode<Item, Variables, IsLocal> {
	return {
		tag: SET_TAG,
		item,
		strict: getSetModel(item, !!config?.isLocal, true),
		partial: getSetModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: HAS_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
