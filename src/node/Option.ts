import { Option } from 'fp-ts/lib/Option'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	ModifyOutputIfLocal,
	AnyBaseNode,
	NodeVariables,
	StaticNodeConfig,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	TypeOfCacheEntry,
	Ref,
	ModifyIfEntity,
	TypeOfRefs
} from './shared'

export interface OptionNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		TypeOfStrictInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfStrictOutput<Item> | null>,
		Option<TypeOf<Item>>,
		TypeOfPartialInput<Item> | null | undefined,
		ModifyOutputIfLocal<IsLocal, TypeOfPartialOutput<Item> | null>,
		Option<TypeOfPartial<Item>>,
		ModifyIfEntity<IsEntity, Option<TypeOf<Item>>, Ref<Option<TypeOfCacheEntry<Item>>>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>,
		ModifyIfEntity<IsEntity, Option<TypeOf<Item>>, Ref<Option<TypeOfRefs<Item>>>>
	> {
	readonly tag: 'Option'
	readonly item: Item
}

export interface StaticOptionNodeConfig<IsLocal extends boolean, IsEntity extends boolean>
	extends StaticNodeConfig<IsLocal, IsEntity> {}

export interface DynamicOptionNodeConfig<
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {}

const OPTION_TAG = 'Option'

export function option<Item extends AnyBaseNode, IsLocal extends boolean = false, IsEntity extends boolean = false>(
	item: Item,
	config?: StaticOptionNodeConfig<IsLocal, IsEntity>
): OptionNode<Item, {}, IsLocal, IsEntity>
export function option<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(item: Item, config: DynamicOptionNodeConfig<Variables, IsLocal, IsEntity>): OptionNode<Item, Variables, IsLocal>
export function option<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config?: StaticOptionNodeConfig<IsLocal, IsEntity> | DynamicOptionNodeConfig<Variables, IsLocal, IsEntity>
): OptionNode<Item, Variables, IsLocal, IsEntity> {
	return {
		tag: OPTION_TAG,
		item,
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasDecodingTransformations: true,
		__hasEncodingTransformations: true,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}

export function markOptionAsEntity<T extends OptionNode<any, any, any, any>>(
	node: T
): OptionNode<T['item'], T['variables'], Exclude<T['__isLocal'], undefined>, true> {
	return {
		...node,
		__isEntity: true
	} as any
}
