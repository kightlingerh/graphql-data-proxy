import { literal } from '../model/Model';
import { scalar, ScalarNode } from './Scalar';
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
	NodeOptions
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

export type ExtractIncludeTypename<T> = [T] extends [{ [_IncludeTypename]: boolean }]
	? T[typeof _IncludeTypename]
	: never;

export interface TypenameNode<Name extends string> extends ScalarNode<Name, string, string, Name> {}

export interface BaseTypeNodeOptions<
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
> extends NodeOptions<ExtractTypeNodePartialDataFromMembers<MS>, Variables, IsLocal, IsEntity> {
	includeTypename?: boolean;
}

export interface IncludeTypenameTypeNodeOptions<
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
> extends BaseTypeNodeOptions<MS, Variables, IsLocal, IsEntity> {
	includeTypename: true;
}

export interface ExcludeTypenameTypeNodeOptions<
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables,
	IsLocal extends boolean,
	IsEntity extends boolean
> extends BaseTypeNodeOptions<MS, Variables, IsLocal, IsEntity> {
	includeTypename?: false;
}

class BaseTypeNode<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
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
		readonly options?: BaseTypeNodeOptions<MS, Variables, IsLocal, IsEntity>
	) {
		super(options?.variables);
	}
}

export class TypeNode<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false,
	IncludeTypename extends boolean = false
> extends BaseTypeNode<
	Typename,
	[IncludeTypename] extends [true] ? MS & { __typename: TypenameNode<Typename> } : MS,
	Variables,
	IsLocal,
	IsEntity
> {
	readonly [_IncludeTypename]!: IncludeTypename;
	constructor(
		__typename: Typename,
		members: MS,
		options?: BaseTypeNodeOptions<
			[IncludeTypename] extends [true] ? MS & { __typename: TypenameNode<Typename> } : MS,
			Variables,
			IsLocal,
			IsEntity
		>
	) {
		const newMembers =
			options?.includeTypename === true && !members.hasOwnProperty('__typename')
				? {
						...members,
						__typename: scalar(__typename, literal(__typename))
				  }
				: members;
		super(__typename, newMembers as any, options as any);
	}
}

export function type<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	__typename: Typename,
	members: MS,
	options: IncludeTypenameTypeNodeOptions<MS & { __typename: TypenameNode<Typename> }, Variables, IsLocal, IsEntity>
): TypeNode<Typename, MS, Variables, IsLocal, IsEntity, true>;

export function type<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	__typename: Typename,
	members: MS,
	options?: ExcludeTypenameTypeNodeOptions<MS, Variables, IsLocal, IsEntity>
): TypeNode<Typename, MS, Variables, IsLocal, IsEntity>;
export function type<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false,
	IncludeTypename extends boolean = false
>(
	__typename: Typename,
	members: MS,
	options?: BaseTypeNodeOptions<
		[IncludeTypename] extends [true] ? MS & { __typename: TypenameNode<Typename> } : MS,
		Variables,
		IsLocal,
		IsEntity
	>
): TypeNode<Typename, MS, Variables, IsLocal, IsEntity, IncludeTypename> {
	return new TypeNode(__typename, members, options);
}

export function pickFromType<T extends TypeNode<any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	keys: P[]
): TypeNode<ExtractTypeName<T>, Pick<T['members'], P>, T['variables']> {
	const n: any = {};
	keys.forEach((k) => {
		n[k] = node.members[k];
	});
	return type(node.__typename, n, node.variables) as any;
}

export function omitFromType<T extends TypeNode<any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	keys: P[]
): TypeNode<ExtractTypeName<T>, Omit<T['members'], P>, T['variables']> {
	const n: any = {};
	keys.forEach((k) => {
		if (!keys.includes(k)) {
			n[k] = node.members[k];
		}
	});
	return type(node.__typename, n, node.variables) as any;
}

export function markTypeAsEntity<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false
>(
	node: BaseTypeNode<Typename, MS, Variables, IsLocal, IsEntity>
): BaseTypeNode<Typename, MS, Variables, IsLocal, true> {
	return new TypeNode(node.__typename, node.members, { ...node.options, isEntity: true });
}
