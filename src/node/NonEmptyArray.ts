import { Option } from 'fp-ts/Option'
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
	TypeOfStrictOutput,
	HAS_TRANSFORMATIONS,
	Ref,
	TypeOfCacheEntry,
	ModifyIfEntity,
	TypeOfRefs
} from './shared'

export interface NonEmptyArrayNode<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>
	extends BaseNode<
		Array<TypeOfStrictInput<Item>>,
		ModifyOutputIfLocal<IsLocal, NonEmptyArray<TypeOfStrictOutput<Item>>>,
		NonEmptyArray<TypeOf<Item>>,
		Array<TypeOfPartialInput<Item>>,
		ModifyOutputIfLocal<IsLocal, NonEmptyArray<TypeOfPartialOutput<Item>>>,
		NonEmptyArray<TypeOfPartial<Item>>,
		ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfCacheEntry<Item>>>>>,
		Variables,
		ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item>,
		ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfRefs<Item>>>>>
	> {
	readonly tag: 'NonEmptyArray'
	readonly item: Item
	readonly __customCache?: CustomCache<
		NonEmptyArray<TypeOfPartial<Item>>,
		ExtractNodeDefinitionType<ExtractSubVariablesDefinition<Item> & ExtractVariablesDefinition<Item> & Variables>,
		ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfCacheEntry<Item>>>>>
	>
}

export interface StaticNonEmptyArrayNodeConfig<
	Item extends AnyBaseNode,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends StaticNodeConfig<
		NonEmptyArray<TypeOfPartial<Item>>,
		ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfCacheEntry<Item>>>>>,
		{},
		IsLocal
	> {}

export interface DynamicNonEmptyArrayNodeConfig<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
>
	extends DynamicNodeConfig<
		Variables,
		NonEmptyArray<TypeOfPartial<Item>>,
		ModifyIfEntity<IsEntity, NonEmptyArray<TypeOf<Item>>, Ref<Option<NonEmptyArray<TypeOfCacheEntry<Item>>>>>,
		{},
		IsLocal
	> {}

const NON_EMPTY_ARRAY_TAG = 'NonEmptyArray'

function getNonEmptyArrayModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(M.fromNonEmptyArray(isStrict ? item.strict : item.partial), isLocal, false, false)
}

export function nonEmptyArray<
	Item extends AnyBaseNode,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config?: StaticNonEmptyArrayNodeConfig<Item, IsLocal, IsEntity>
): NonEmptyArrayNode<Item, {}, IsLocal, IsEntity>
export function nonEmptyArray<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config: DynamicNonEmptyArrayNodeConfig<Item, Variables, IsLocal, IsEntity>
): NonEmptyArrayNode<Item, Variables, IsLocal, IsEntity>
export function nonEmptyArray<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config?:
		| StaticNonEmptyArrayNodeConfig<Item, IsLocal, IsEntity>
		| DynamicNonEmptyArrayNodeConfig<Item, Variables, IsLocal, IsEntity>
): NonEmptyArrayNode<Item, Variables, IsLocal, IsEntity> {
	return {
		tag: NON_EMPTY_ARRAY_TAG,
		item,
		strict: getNonEmptyArrayModel(item, !!config?.isLocal, true),
		partial: getNonEmptyArrayModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: HAS_TRANSFORMATIONS,
		__customCache: config?.useCustomCache,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
