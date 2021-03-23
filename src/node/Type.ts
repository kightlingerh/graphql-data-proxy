import { literal } from '../model/Model';
import { scalar, ScalarNode } from './Scalar';
import {
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
	BaseNode,
	_HasEncodingTransformations,
	_HasDecodingTransformations
} from './shared';

export type ExtractTypeName<T> = [T] extends [{ __typename: infer A }] ? A : never;

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

export interface TypenameNode<Name extends string> extends ScalarNode<Name, string, string, Name> {}

type TypeNodeMembers<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	IncludeTypename extends boolean
> = IncludeTypename extends true ? MS & { readonly __typename: TypenameNode<Typename> } : MS;

export type TypeNodeOptions<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IncludeTypename extends boolean = false
> = IncludeTypename extends true
	? NodeOptions<ExtractTypeNodePartialDataFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>, Variables> & {
			includeTypename: true;
	  }
	: NodeOptions<ExtractTypeNodePartialDataFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>, Variables>;

export class TypeNode<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false,
	IncludeTypename extends boolean = false
> extends BaseNode<
	ExtractTypeNodeStrictInputFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>,
	ModifyOutputIfLocal<
		IsLocal,
		ExtractTypeNodeStrictOutputFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>
	>,
	ExtractTypeNodeStrictDataFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>,
	ExtractTypeNodePartialInputFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>,
	ModifyOutputIfLocal<
		IsLocal,
		ExtractTypeNodePartialOutputFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>
	>,
	ExtractTypeNodePartialDataFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>,
	ModifyIfEntity<
		IsEntity,
		ExtractTypeNodeStrictDataFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>,
		ExtractTypeNodeCacheEntryFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>
	>,
	Variables,
	ExtractTypeNodeSubVariablesFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>,
	ModifyIfEntity<
		IsEntity,
		ExtractTypeNodeStrictDataFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>,
		ExtractTypeNodeRefsFromMembers<TypeNodeMembers<Typename, MS, IncludeTypename>>
	>
> {
	readonly tag = 'Type';
	readonly members: TypeNodeMembers<Typename, MS, IncludeTypename>;
	readonly [_HasEncodingTransformations]: boolean;
	readonly [_HasDecodingTransformations]: boolean;
	constructor(
		readonly __typename: Typename,
		members: MS,
		options: IncludeTypename extends true ? TypeNodeOptions<Typename, MS, Variables, IncludeTypename> : undefined
	) {
		super(options);
		this.members = options?.includeTypename
			? {
					...members,
					__typename: scalar(__typename, literal(__typename), {
						hasDecodingTransformations: false,
						hasEncodingTransformations: false
					})
			  }
			: (members as any);
		this[_HasEncodingTransformations] = hasEncodingTransformations(this.members);
		this[_HasDecodingTransformations] = hasDecodingTransformations(this.members);
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
	options: TypeNodeOptions<Typename, MS, Variables, true>
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
	options?: TypeNodeOptions<Typename, MS, Variables>
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
	options?: TypeNodeOptions<Typename, MS, Variables, IncludeTypename>
): TypeNode<Typename, MS, Variables, IsLocal, IsEntity, IncludeTypename> {
	return new TypeNode(__typename, members, options as any);
}

export function pickFromType<T extends TypeNode<any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	keys: P[]
): TypeNode<T['__typename'], Pick<T['members'], P>, T['variables']> {
	const n: any = {};
	keys.forEach((k) => {
		n[k] = node.members[k];
	});
	return type(node.__typename, n, node.variables) as any;
}

export function omitFromType<T extends TypeNode<any, any, any, any, any, any>, P extends keyof T['members']>(
	node: T,
	keys: P[]
): TypeNode<T['__typename'], Omit<T['members'], P>, T['variables']> {
	const n: any = {};
	for (const k in node.members) {
		if (!keys.includes(k as P)) {
			n[k] = node.members[k];
		}
	}
	return type(node.__typename, n, node.variables) as any;
}

export function markTypeAsEntity<
	Typename extends string,
	MS extends Record<string, AnyNode>,
	Variables extends NodeVariables = {},
	IsLocal extends boolean = false,
	IsEntity extends boolean = false,
	IncludeTypename extends boolean = false
>(
	node: TypeNode<Typename, MS, Variables, IsLocal, IsEntity, IncludeTypename>
): TypeNode<Typename, MS, Variables, IsLocal, true, IncludeTypename> {
	return type(node.__typename, node.members, { ...node.options, isEntity: true });
}
