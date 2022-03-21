import type { Rule } from 'eslint';

type Node = Rule.Node;
type RuleContext = Rule.RuleContext;

type Stack = {
  nodes: Node[];
  root: Node;
};

const getStack = (node: Node) => {
  const stack: Stack = {
    nodes: [],
    root: node,
  };

  for (let current = node; current.type !== 'Program'; current = current.parent) {
    switch (current.type) {
      case 'ExportDefaultDeclaration':
      case 'ExportNamedDeclaration':
        stack.root = current;
        break;

      case 'VariableDeclarator':
        stack.root = current;
        break;

      case 'ExportSpecifier':
      case 'ObjectExpression':
      case 'VariableDeclaration':
        break;

      default:
        stack.nodes.unshift(current);
    }
  }

  return stack;
};

const matches = (defs: Node[], refs: Node[]) => {
  // When there are no defs, the definition is inlined. This must be a match as we know the refs contain the initial
  // definition.
  if (!defs.length) {
    return true;
  }

  // When there are no refs, the reference refers to the entire definition and therefore must be a match.
  if (!refs.length) {
    return true;
  }

  // When both the references and definitions exist, they should match in length
  if (defs.length !== refs.length) {
    return false;
  }

  return defs.every((def, i) => {
    const ref = refs[i];

    if (def.type === 'Property') {
      // There is a match between the def and the ref when both names match:
      //
      // const fooDef = { bar: '' };
      // const barRef = fooDef.bar
      //
      // There is no match when the ref property does not match the definition key name:
      //
      // const barRef = fooDef.notFound
      return (
        def.key.type === 'Identifier' &&
        ref.type === 'MemberExpression' &&
        ref.property.type === 'Identifier' &&
        ref.property.name === def.key.name
      );
    }

    // Anything here is either unsupported or should not match...
    return false;
  });
};

export type InvalidDefinition = {
  type: 'invalid';
  node: Node;
};

export type ValidDefinition = {
  type: 'valid';
};

export type Validity = InvalidDefinition | ValidDefinition;

export const validateDefinition = (context: RuleContext, node: Node): Validity => {
  const scope = context.getScope();
  // Ignore any expression defined outside of the global or module scope as we have no way of statically analysing them
  if (scope.type !== 'global' && scope.type !== 'module') {
    return {
      type: 'valid',
    };
  }

  const { root, nodes } = getStack(node.parent);
  if (root.type === 'ExportDefaultDeclaration' || root.type === 'ExportNamedDeclaration') {
    return {
      type: 'invalid',
      node: root,
    };
  }

  if (root.type !== 'VariableDeclarator') {
    return {
      type: 'valid',
    };
  }

  // Find the reference to the variable declarator
  const reference = scope.references.find(({ identifier }) => identifier === root.id);
  if (!reference) {
    return {
      type: 'valid',
    };
  }

  // Iterate through all of the references to the resolved variable declarator node
  const { resolved } = reference;
  for (const { identifier } of resolved?.references ?? []) {
    // Skip references to the root, since it has already been processed above
    if (identifier === root.id) {
      continue;
    }

    const { nodes: refs } = getStack((identifier as Rule.Node).parent);
    // Only validate the resolved reference if it accesses the definition node
    if (matches(nodes, refs.reverse())) {
      // Now validate the identifier reference as a definition
      const validity = validateDefinition(context, identifier as Rule.Node);
      if (validity.type === 'invalid') {
        return validity;
      }
    }
  }

  return {
    type: 'valid',
  };
};
