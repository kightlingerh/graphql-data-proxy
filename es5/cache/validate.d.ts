import { Tree } from 'fp-ts/lib/Tree';
import * as N from '../node';
export declare function validate(schema: N.SchemaNode<any, any>, request: N.SchemaNode<any, any>): Tree<string>[];
