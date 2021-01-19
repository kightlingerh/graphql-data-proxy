import {Node} from './shared';
import {type, TypeNode} from './Type';

export function schema<Typename extends string, MS extends Record<string, Node>>(
	__typename: Typename,
	members: MS
): TypeNode<Typename, MS> {
	return type(__typename, members)
}
