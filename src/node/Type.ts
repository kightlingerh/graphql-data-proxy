import { literal } from '../model/Model';
import { scalar, ScalarNode } from './Scalar';
import {
	BaseNode,
	ExtractSubVariablesDefinition,
	ExtractVariablesDefinition,
	hasDecodingTransformations,
	hasEncodingTransformations,
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
	NodeOptions,
	_HasEncodingTransformations,
	_HasDecodingTransformations
} from './shared';

export type ExtractTypeName<T> = [T] extends [{ __typename: string }] ? T['__typename'] : never;

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

export type ExtractIncludeTypename<T> = [T] extends [{ [_IncludeTypename]: infer A }] ? A : never;

export interface TypenameNode<Name extends string> extends ScalarNode<Name, string, string, Name> {}

export interface BaseTypeNodeOptions<MS extends Record<string, AnyNode>, Variables extends NodeVariables = {}>
	extends NodeOptions<ExtractTypeNodePartialDataFromMembers<MS>, Variables> {
	includeTypename?: boolean;
}

export interface IncludeTypenameTypeNodeOptions<
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {}
> extends BaseTypeNodeOptions<MS, Variables> {
	includeTypename: true;
}

export interface ExcludeTypenameTypeNodeOptions<
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {}
> extends BaseTypeNodeOptions<MS, Variables> {
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
	ExtractTypeNodeRefsFromMembers<MS>
> {
	readonly tag = 'Type';
	constructor(
		readonly __typename: Typename,
		readonly members: MS,
		options?: BaseTypeNodeOptions<MS, Variables>
	) {
		super(options);
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
	readonly [_HasEncodingTransformations]: boolean;
	readonly [_HasDecodingTransformations]: boolean;
	constructor(
		__typename: Typename,
		members: MS,
		options?: BaseTypeNodeOptions<
			[IncludeTypename] extends [true] ? MS & { __typename: TypenameNode<Typename> } : MS,
			Variables
		>
	) {
		const newMembers =
			options?.includeTypename === true && !members.hasOwnProperty('__typename')
				? {
						...members,
						__typename: scalar(__typename, literal(__typename), {
							hasDecodingTransformations: false,
							hasEncodingTransformations: false
						})
				  }
				: members;
		super(__typename, newMembers as any, options as any);
		this[_HasDecodingTransformations] = hasDecodingTransformations(newMembers);
		this[_HasEncodingTransformations] = hasEncodingTransformations(newMembers);
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
	options: IncludeTypenameTypeNodeOptions<MS & { __typename: TypenameNode<Typename> }, Variables>
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
	options?: ExcludeTypenameTypeNodeOptions<MS, Variables>
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
		Variables
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

export function markAsEntity<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false,
	IncludeTypename extends boolean = false
>(
	node: BaseTypeNode<Typename, MS, Variables, IsLocal, IsEntity>
): TypeNode<Typename, MS, Variables, IsLocal, true, IncludeTypename> {
	return new TypeNode(node.__typename, node.members, { ...node.options, isEntity: true });
}
