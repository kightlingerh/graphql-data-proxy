"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showTypeNode = exports.showSumNode = exports.showNode = void 0;
exports.showNode = {
    show: (node) => {
        switch (node.tag) {
            case 'Scalar':
                return `Scalar: ${node.name}`;
            case 'Map':
                return `Map<${exports.showNode.show(node.key)}, ${exports.showNode.show(node.item)}>`;
            case 'Option':
                return `Option<${exports.showNode.show(node.item)}>`;
            case 'Array':
                return `Array<${exports.showNode.show(node.item)}>`;
            case 'NonEmptyArray':
                return `NonEmptyArray<${exports.showNode.show(node.item)}>`;
            case 'Sum':
                return exports.showSumNode.show(node);
            case 'Type':
                return exports.showTypeNode.show(node);
            default:
                return node.tag;
        }
    }
};
exports.showSumNode = {
    show: (node) => `{\n  ${node.members
        .map((member) => `${member.__typename}:  ${exports.showTypeNode.show(member)}`)
        .join(',\n  ')}  \n}`
};
exports.showTypeNode = {
    show: (node) => `{\n  ${Object.keys(node.members)
        .map((k) => `${k}: ${exports.showNode.show(node.members[k])}`.trimEnd())
        .join(',\n')}  \n}`
};
