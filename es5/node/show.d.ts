import { Show } from 'fp-ts/lib/Show';
import { Node } from './Node';
import { SumNode } from './Sum';
import { TypeNode } from './Type';
export declare const showNode: Show<Node>;
export declare const showSumNode: Show<SumNode<any, any, any>>;
export declare const showTypeNode: Show<TypeNode<any, any, any, any>>;
