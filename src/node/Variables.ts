import { isEmptyObject } from '../shared';
import { useStrictNodeDecoder } from './Decoder';
import { useNodeEncoder } from './Encoder';
import { useStrictNodeEq } from './Eq';
import { useStrictNodeGuard } from './Guard';
import { Node } from './Node';
import {
	ExtractMergedVariablesDefinition,
	ExtractNodeDefinitionInput,
	ExtractNodeDefinitionOutput,
	ExtractNodeDefinitionType,
	ExtractVariablesDefinition,
	NodeVariables,
	TypeOfMergedVariables,
	TypeOfVariables
} from './shared';
import { Encoder, type } from '../model/Encoder';
import { Decoder, fromType } from '../model/Decoder';
import { Eq, type as eqType } from '../model/Eq';
import { Guard, type as guardType } from '../model/Guard';

function mergeVariables(node: Node, variables: Record<string, Node>[]) {
	if (!isEmptyObject(node.variables)) {
		variables.push(node.variables);
	}
	switch (node.tag) {
		case 'Type':
			for (const value of Object.values<Node>(node.members)) {
				mergeVariables(value, variables);
			}
			break;
		case 'Array':
		case 'NonEmptyArray':
		case 'Option':
		case 'Map':
			mergeVariables(node.item, variables);
			break;
		case 'Mutation':
			mergeVariables(node.result, variables);
			break;
		case 'Sum':
			node.members.forEach((member: Node) => mergeVariables(member, variables));
			break;
	}
}

export function useNodeMergedVariables<N extends Node>(node: N): ExtractMergedVariablesDefinition<N> {
	const definitions: Record<string, Node>[] = [];
	mergeVariables(node, definitions); // collect variable definitions and then merge in one go
	return Object.assign({}, ...definitions.reverse()); // reverse so that parent node variables overwrite child node variables
}

function useFromDef(fromDef: (def: Record<string, any>) => any, toItem: (node: Node) => any) {
	return (def: NodeVariables) => {
		const x: any = {};
		for (const [key, value] of Object.entries(def)) {
			x[key] = toItem(value as Node);
		}
		return fromDef(x) as any;
	};
}

export type NodeMergedVariablesEncoder<N> = Encoder<
	ExtractNodeDefinitionOutput<ExtractMergedVariablesDefinition<N>>,
	ExtractNodeDefinitionType<ExtractMergedVariablesDefinition<N>>
>;

const toDefEncoder = useFromDef(type, useNodeEncoder);

export function useNodeMergedVariablesEncoder<N extends Node>(node: N): NodeMergedVariablesEncoder<N> {
	return toDefEncoder(useNodeMergedVariables(node));
}

export type NodeVariablesEncoder<N> = Encoder<
	ExtractNodeDefinitionOutput<ExtractVariablesDefinition<N>>,
	ExtractNodeDefinitionType<ExtractVariablesDefinition<N>>
>;

export function useNodeVariablesEncoder<N extends Node>(node: N): NodeVariablesEncoder<N> {
	return toDefEncoder(node.variables);
}

export type NodeMergedVariablesDecoder<N> = Decoder<
	ExtractNodeDefinitionInput<ExtractMergedVariablesDefinition<N>>,
	ExtractNodeDefinitionType<ExtractMergedVariablesDefinition<N>>
>;

const toDefDecoder = useFromDef(fromType, useStrictNodeDecoder);

export function useNodeMergedVariablesDecoder<N extends Node>(node: N): NodeMergedVariablesDecoder<N> {
	return toDefDecoder(useNodeMergedVariables(node));
}

export type NodeVariablesDecoder<N> = Decoder<
	ExtractNodeDefinitionInput<ExtractVariablesDefinition<N>>,
	ExtractNodeDefinitionType<ExtractVariablesDefinition<N>>
>;

export function useNodeVariablesDecoder<N extends Node>(node: N): NodeVariablesDecoder<N> {
	return toDefDecoder(node.variables);
}

const toDefEq = useFromDef(eqType, useStrictNodeEq);

export type NodeMergedVariablesEq<N> = Eq<ExtractNodeDefinitionType<ExtractMergedVariablesDefinition<N>>>;

export function useNodeMergedVariablesEq<N extends Node>(node: N): NodeMergedVariablesEq<N> {
	return toDefEq(useNodeMergedVariables(node));
}

export type NodeVariablesEq<N> = Eq<ExtractNodeDefinitionType<ExtractVariablesDefinition<N>>>;

export function useNodeVariablesEq<N extends Node>(node: N): NodeVariablesEq<N> {
	return toDefEq(node.variables);
}

export type NodeMergedVariablesGuard<N> = Guard<unknown, TypeOfMergedVariables<N>>;

const toDefGuard = useFromDef(guardType, useStrictNodeGuard);

export function useNodeMergedVariablesGuard<N extends Node>(node: N): NodeMergedVariablesGuard<N> {
	return toDefGuard(useNodeMergedVariables(node));
}

export type NodeVariablesGuard<N> = Guard<unknown, TypeOfVariables<N>>;

export function useNodeVariablesGuard<N extends Node>(node: N): NodeVariablesGuard<N> {
	return toDefGuard(node.variables);
}
