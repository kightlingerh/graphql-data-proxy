import { Show } from 'fp-ts/lib/Show';
import { Node, SumNode, TypeNode } from './Node';
export declare const showNode: Show<Node>;
export declare const showSumNode: Show<SumNode<TypeNode<any, any>[]>>;
export declare const showTypeNode: Show<TypeNode<any, any>>;
