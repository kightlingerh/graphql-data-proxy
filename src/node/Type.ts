import { ScalarNode } from './Scalar';
import {
	BaseNode,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	Intersection,
	ModifyOutputIfLocal,
	AnyNode,
	NodeVariables,
	TypeOf,
	TypeOfPartial,
	TypeOfPartialInput,
	TypeOfPartialOutput,
	TypeOfStrictInput,
	TypeOfStrictOutput,
	Values,
	CacheNode,
	ModifyIfEntity,
	TypeOfRefs,
	BaseNodeOptions,
	ToId,
	DynamicNodeOptions
} from './shared';

export type ExtractTypeName<T> = [T] extends [{ __typename: string }] ? T['__typename'] : never;

export type ExtractTypeNodeMembers<T> = [T] extends [{ members: Record<string, AnyNode> }] ? T['members'] : never;

export type ExtractTypeNodeStrictDataFromMembers<MS extends Record<string, AnyNode>> = {
	[K in keyof MS]: TypeOf<MS[K]>;
};

export type ExtractTypeNodeStrictInputFromMembers<MS extends Record<string, AnyNode>> = {
	[K in keyof MS]: TypeOfStrictInput<MS[K]>;
};
export type ExtractTypeNodeStrictOutputFromMembers<MS extends Record<string, AnyNode>> = {
	[K in keyof MS]: TypeOfStrictOutput<MS[K]>;
};
export type ExtractTypeNodePartialDataFromMembers<MS extends Record<string, AnyNode>> = {
	[K in keyof MS]?: TypeOfPartial<MS[K]>;
};
export type ExtractTypeNodePartialInputFromMembers<MS extends Record<string, AnyNode>> = {
	[K in keyof MS]?: TypeOfPartialInput<MS[K]>;
};
export type ExtractTypeNodePartialOutputFromMembers<MS extends Record<string, AnyNode>> = {
	[K in keyof MS]?: TypeOfPartialOutput<MS[K]>;
};
export type ExtractTypeNodeCacheEntryFromMembers<MS extends Record<string, AnyNode>> = {
	[K in keyof MS]: CacheNode<MS[K]>;
};

export type ExtractTypeNodeRefsFromMembers<MS extends Record<string, AnyNode>> = {
	[K in keyof MS]: TypeOfRefs<MS[K]>;
};

export type ExtractTypeNodeSubVariablesFromMembers<MS extends Record<string, AnyNode>> = {} & Intersection<
	Values<
		{
			[K in keyof MS]: ExtractSubVariablesDefinition<MS[K]> & ExtractVariablesDefinition<MS[K]>;
		}
	>
>;

export const _IncludeTypename = '_IT';

export type _IncludeTypename = typeof _IncludeTypename;

export type ExtractIncludeTypename<T> = [T] extends [{ [_IncludeTypename]: boolean }]
	? T[typeof _IncludeTypename]
	: never;

export interface TypenameNode<Name extends string> extends ScalarNode<Name, string, string, Name> {}

export interface StaticTypeNodeOptions<
	MS extends Record<string, AnyNode>,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false,
	Variables extends Record<string, AnyNode> = {}
> extends BaseNodeOptions<IsLocal, IsEntity, Variables> {
	toId?: ToId<ExtractTypeNodePartialDataFromMembers<MS>, Variables>;
}

export interface DynamicTypeNodeOptions<
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends DynamicNodeOptions<Variables, IsLocal, IsEntity> {
	toId?: ToId<ExtractTypeNodePartialDataFromMembers<MS>, Variables>;
}

export class TypeNode<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends Record<string, AnyNode> = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
> extends BaseNode<
	ExtractTypeNodeStrictInputFromMembers<MS>,
	ModifyOutputIfLocal<IsLocal, ExtractTypeNodeStrictOutputFromMembers<MS>>,
	ExtractTypeNodeStrictDataFromMembers<MS>,
	ExtractTypeNodePartialInputFromMembers<MS>,
	ModifyOutputIfLocal<IsLocal, ExtractTypeNodePartialOutputFromMembers<MS>>,
	ExtractTypeNodePartialDataFromMembers<MS>,
	ModifyIfEntity<IsEntity, ExtractTypeNodeStrictDataFromMembers<MS>, ExtractTypeNodeCacheEntryFromMembers<MS>>,
	Variables,
	ExtractTypeNodeSubVariablesFromMembers<MS>,
	ModifyIfEntity<IsEntity, ExtractTypeNodeStrictDataFromMembers<MS>, ExtractTypeNodeRefsFromMembers<MS>>
> {
	readonly tag = 'Type';
	constructor(
		readonly __typename: Typename,
		readonly members: MS,
		readonly options?: DynamicTypeNodeOptions<MS, Variables, IsLocal, IsEntity> | StaticTypeNodeOptions<MS, IsLocal, IsEntity, Variables>
	) {
		super(options?.variables);
	}
}

export function type<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	__typename: Typename,
	members: MS,
	options?: StaticTypeNodeOptions<MS, IsLocal, IsEntity>
): TypeNode<Typename, MS, {}, IsLocal, IsEntity>;
export function type<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends Record<string, AnyNode> = Record<string, AnyNode>,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	__typename: Typename,
	members: MS,
	options: DynamicTypeNodeOptions<MS, Variables, IsLocal, IsEntity>
): TypeNode<Typename, MS, Variables, IsLocal, IsEntity>;
export function type<
	Typename extends string,
	MS extends Record<string, AnyNode> = {},
	Variables extends Record<string, AnyNode> = Record<string, AnyNode>,
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	__typename: Typename,
	members: MS,
	options?: DynamicTypeNodeOptions<MS, Variables, IsLocal, IsEntity> | StaticTypeNodeOptions<MS, IsLocal, IsEntity, Variables>
): TypeNode<Typename, MS, Variables, IsLocal, IsEntity> {
	return new TypeNode(__typename, members, options);
}

export function pickFromType<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean,
	P extends keyof MS
>(node: TypeNode<Typename, MS, Variables, IsLocal, IsEntity>, keys: P[]): TypeNode<Typename, Pick<MS, P>, Variables> {
	const n: any = {};
	keys.forEach((k) => {
		n[k] = node.members[k];
	});
	return new TypeNode(
		node.__typename,
		n,
		node.options
	) as any;
}

export function omitFromType<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean,
	P extends keyof MS
>(
	node: TypeNode<Typename, MS, Variables, IsLocal, IsEntity>,
	keys: P[]
): TypeNode<Typename, Omit<MS, P>, Variables, IsLocal, IsEntity> {
	const n: any = {};
	keys.forEach((k) => {
		if (!keys.includes(k)) {
			n[k] = node.members[k];
		}
	});
	return new TypeNode(
		node.__typename,
		n,
		node.variables
	) as any;
}

export function markTypeAsEntity<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(node: TypeNode<Typename, MS, Variables, IsLocal, IsEntity>): TypeNode<Typename, MS, Variables, IsLocal, true> {
	return new TypeNode(node.__typename, node.members, { ...node.options, isEntity: true });
}
