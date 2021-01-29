import { Node } from './Node';
import { SchemaNode } from './Schema';
export declare function print<N extends string, T extends {
    [K in keyof T]: Node;
}>(schema: SchemaNode<N, T>, operation: string, operationName: string): string;
