import { Tree } from 'fp-ts/lib/Tree';
import * as D from '../document/DocumentNode';
export declare function validate<S extends D.TypeNode<string, any>>(schema: S): <R extends D.TypeNode<string, any, {}>>(request: R) => Array<Tree<string>>;
