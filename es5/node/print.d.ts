import { MapNode } from './Map';
import { SchemaNode } from './Schema';
export interface MapPrinter {
    tokenizeMapVariables: (node: MapNode<any, any, any, any, any, any, any, any>, keyTokens: string[], valueTokens: string[]) => string[];
    tokenizeMapRequest: (node: MapNode<any, any, any, any, any, any, any, any>, keyTokens: string[], valueTokens: string[]) => string[];
}
export declare function definePrinter(mapPrinter?: Partial<MapPrinter>): (schema: SchemaNode<any, any>, operation: string, operationName: string) => string;
