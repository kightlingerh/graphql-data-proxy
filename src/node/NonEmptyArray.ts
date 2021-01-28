import { Option } from 'fp-ts/lib/Option'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as M from '../model/Model'
import {
	BaseNode,
	DynamicNodeConfig,
	EMPTY_VARIABLES,
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
}

export interface StaticNonEmptyArrayNodeConfig<IsLocal extends boolean, IsEntity extends boolean>
	extends StaticNodeConfig<IsLocal, IsEntity> {}

export interface DynamicNonEmptyArrayNodeConfig<
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
> extends DynamicNodeConfig<Variables, IsLocal, IsEntity> {}

const NON_EMPTY_ARRAY_TAG = 'NonEmptyArray'

function getNonEmptyArrayModel<Item extends AnyBaseNode>(item: Item, isLocal: boolean, isStrict: boolean) {
	return useAdjustedModel(M.fromNonEmptyArray(isStrict ? item.strict : item.partial), isLocal, false, false)
}

export function nonEmptyArray<
	Item extends AnyBaseNode,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(item: Item, config?: StaticNonEmptyArrayNodeConfig<IsLocal, IsEntity>): NonEmptyArrayNode<Item, {}, IsLocal, IsEntity>
export function nonEmptyArray<
	Item extends AnyBaseNode,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config: DynamicNonEmptyArrayNodeConfig<Variables, IsLocal, IsEntity>
): NonEmptyArrayNode<Item, Variables, IsLocal, IsEntity>
export function nonEmptyArray<
	Item extends AnyBaseNode,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	item: Item,
	config?:
		| StaticNonEmptyArrayNodeConfig<IsLocal, IsEntity>
		| DynamicNonEmptyArrayNodeConfig<Variables, IsLocal, IsEntity>
): NonEmptyArrayNode<Item, Variables, IsLocal, IsEntity> {
	return {
		tag: NON_EMPTY_ARRAY_TAG,
		item,
		strict: getNonEmptyArrayModel(item, !!config?.isLocal, true),
		partial: getNonEmptyArrayModel(item, !!config?.isLocal, false),
		variables: config?.variables ?? EMPTY_VARIABLES,
		__hasTransformations: HAS_TRANSFORMATIONS,
		__isEntity: config?.isEntity,
		__isLocal: config?.isLocal
	}
}
