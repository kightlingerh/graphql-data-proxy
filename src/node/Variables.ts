import { isEmptyObject } from '../shared';
import { Node } from './Node';
import { ExtractMergedVariablesDefinition } from './shared';

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
