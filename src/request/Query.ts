
import * as D from '../document/DocumentNode';

export type QueryNode =
	| D.LiteralNode<any>
	| TypeNode<string, any, any>
	| WrappedNode<any>
	| SumNode<any, any>
	| D.ScalarNode<string, any, any>

export interface TypeNode<N extends string, T extends { [K in keyof T]: QueryNode }, V extends D.VariablesNode = {}>
	extends D.TypeNode<N, T, V> {}

export type WrappedNode<T extends QueryNode> =
	| ArrayNode<T, any>
	| MapNode<T, any, any>
	| OptionNode<T, any>
	| NonEmptyArrayNode<T, any>

export interface ArrayNode<T extends QueryNode, V extends D.VariablesNode = {}> extends D.ArrayNode<T, V> {};

export interface MapNode<K extends QueryNode, T extends QueryNode, V extends D.VariablesNode = {}> extends D.MapNode<K, T, V> {}

export interface OptionNode<T extends QueryNode, V extends D.VariablesNode = {}>
	extends D.OptionNode<T, V> {}

export interface NonEmptyArrayNode<T extends QueryNode, V extends D.VariablesNode = {}>
	extends D.NonEmptyArrayNode<
		T, V
		> {
}

export interface SumNode<T extends { [K in keyof T]: TypeNode<string, any> }, V extends D.VariablesNode = {}>
	extends D.SumNode<T, V> {}

export const string = D.string;

export const staticString = D.staticString;

export const number = D.number;

export const staticNumber = D.staticNumber;

export const boolean = D.boolean;

export const staticBoolean = D.staticBoolean;

export const type = D.type;

export const array = D.array;

export const nonEmptyArray = D.nonEmptyArray;

export const option = D.option;

export const map = D.map;

export const scalar = D.scalar;

