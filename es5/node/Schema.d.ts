import { AnyBaseNode } from './shared';
import { BaseTypeNode, TypeNode } from './Type';
export interface SchemaNode<Typename extends string, MS extends Record<string, AnyBaseNode>> extends BaseTypeNode<Typename, MS> {
}
export declare function schema<Typename extends string, MS extends Record<string, AnyBaseNode>>(__typename: Typename, members: MS): TypeNode<Typename, MS>;
