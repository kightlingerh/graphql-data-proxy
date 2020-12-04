import { Node, SchemaNode } from './Node';
export declare function print<N extends string, T extends {
    [K in keyof T]: Node;
}>(schema: SchemaNode<N, T>, operation: string, operationName: string): string;
