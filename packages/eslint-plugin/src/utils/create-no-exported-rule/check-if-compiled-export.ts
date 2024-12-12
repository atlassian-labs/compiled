import type { Rule, Scope as ScopeNamespace } from 'eslint';

import { getScope, getSourceCode } from '../context-compat';

import { isStyledComponent } from './is-styled-component';

type Node = Rule.Node;
type RuleContext = Rule.RuleContext;
type Scope = ScopeNamespace.Scope;

type Stack = {
  nodes: Node[];
  root: Node;
  scope: Scope;
};

const getStack = (context: RuleContext, node: Node) => {
  const { scopeManager } = getSourceCode(context);
  const stack: Omit<Stack, 'scope'> = {
    nodes: [],
    root: node,
  };

  let scope: Scope | undefined = undefined;

  for (let current = node; current.type !== 'Program'; current = current.parent) {
    if (!scope) {
      const currentScope = scopeManager.acquire(current);
      if (currentScope) {
        scope = currentScope;
      }
    }

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

  return {
    ...stack,
    scope: scope ?? getScope(context, node),
  };
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

type Yes = {
  isExport: true;
  node: Node;
};

type No = {
  isExport: false;
};

type IsCompiledExport = Yes | No;

export const checkIfCompiledExport = (
  context: RuleContext,
  node: Node,
  scope: Scope = getScope(context, node)
): IsCompiledExport => {
  // Ignore any expression defined outside of the global or module scope as we have no way of statically analysing them
  if (scope.type !== 'global' && scope.type !== 'module') {
    return {
      isExport: false,
    };
  }

  const { root, nodes } = getStack(context, node.parent);
  // Exporting a component with a css reference should be allowed
  if (isStyledComponent(nodes, context)) {
    return {
      isExport: false,
    };
  }

  if (root.type === 'ExportDefaultDeclaration' || root.type === 'ExportNamedDeclaration') {
    return {
      isExport: true,
      node: root,
    };
  }

  if (root.type !== 'VariableDeclarator') {
    return {
      isExport: false,
    };
  }

  // Find the reference to the variable declarator
  const reference = scope.references.find(({ identifier }) => identifier === root.id);
  if (!reference) {
    return {
      isExport: false,
    };
  }

  // Iterate through all of the references to the resolved variable declarator node
  const { resolved } = reference;
  for (const { identifier } of resolved?.references ?? []) {
    // Skip references to the root, since it has already been processed above
    if (identifier === root.id) {
      continue;
    }

    const { nodes: refs, scope: nextScope } = getStack(context, (identifier as Rule.Node).parent);

    // Only validate the resolved reference if it accesses the definition node
    if (matches(nodes, refs.reverse())) {
      // Now validate the identifier reference as a definition
      const validity = checkIfCompiledExport(context, identifier as Rule.Node, nextScope);
      if (validity.isExport) {
        return validity;
      }
    }
  }

  return {
    isExport: false,
  };
};
