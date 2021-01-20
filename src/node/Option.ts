import { Option } from 'fp-ts/Option'
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

export interface OptionNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false
>
	extends BaseNode<
		TypeOfStrictInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Item> | null>,
		Option<TypeOf<Item>>,
		TypeOfPartialInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Item> | null>,
		Option<TypeOfPartial<Item>>,
		Option<TypeOfPartial<Item>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>
	> {
	readonly tag: 'Option'
	readonly item: Item
	readonly __customCache?: CustomCache<
		Option<TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		Option<TypeOfPartial<Item>>
	>
}

export interface StaticOptionNodeConfig<Item extends AnyBaseNode, IsLocal extends boolean>
	extends StaticNodeConfig<Option<TypeOfPartial<Item>>, Option<TypeOfPartial<Item>>, {}, IsLocal> {}

export interface DynamicOptionNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean
> extends DynamicNodeConfig<Variables, Option<TypeOfPartial<Item>>, Option<TypeOfPartial<Item>>, {}, IsLocal> {}

const OPTION_TAG = 'Option'

function getOptionModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(
		M.fromOption(isStrict ? item.strict : item.partial),
		isLocal,
		false,
		false
	)
}

export function option<Item extends AnyBaseNode, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticOptionNodeConfig<Item, IsLocal>
): OptionNode<Item, {}, IsLocal>
export function option<Item extends AnyBaseNode, Variables extends NodeVariables, IsLocal extends boolean = false>(
	item: Item,
	config: DynamicOptionNodeConfig<Item, Variables, IsLocal>
): OptionNode<Item, Variables, IsLocal>
export function option<Item extends AnyBaseNode, Variables extends NodeVariables = {}, IsLocal extends boolean = false>(
	item: Item,
	config?: StaticOptionNodeConfig<Item, IsLocal> | DynamicOptionNodeConfig<Item, Variables, IsLocal>
): OptionNode<Item, Variables, IsLocal> {
	return {
		tag: OPTION_TAG,
		item,
		strict: getOptionModel(item, !!config?.isLocal, true),
		partial: getOptionModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: HAS_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
