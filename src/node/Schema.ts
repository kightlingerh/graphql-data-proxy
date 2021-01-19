import { AnyBaseNode } from './shared'
import {BaseTypeNode, type, TypeNode} from './Type'

export interface SchemaNode<Typename extends string, MS extends Record<string, AnyBaseNode>> extends BaseTypeNode<Typename, MS> {}

export function schema<Typename extends string, MS extends Record<string, AnyBaseNode>>(
	__typename: Typename,
	members: MS
): TypeNode<Typename, MS> {
	return type(__typename, members)
}
