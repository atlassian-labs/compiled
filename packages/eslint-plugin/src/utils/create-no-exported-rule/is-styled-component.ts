import type { Rule } from 'eslint';
import type { MemberExpression, Identifier } from 'estree';

import { findCompiledImportDeclarations } from '../ast';

type Node = Rule.Node;
type RuleContext = Rule.RuleContext;

/**
 * Returns the node that could define a Compiled component
 *
 * @param nodes
 * @returns
 */
const findNode = (nodes: Node[]): MemberExpression | Identifier | undefined => {
  const node = nodes.find(
    (n) => n.type === 'TaggedTemplateExpression' || n.type === 'CallExpression'
  );

  if (!node) {
    return;
  }

  if (node.type === 'CallExpression') {
    // Eg. const Component = styled.button(style)
    if (node.callee.type === 'MemberExpression') {
      return node.callee;
    }

    // Eg. const Component = styled(button)(style)
    if (node.callee.type === 'CallExpression' && node.callee.callee.type === 'Identifier') {
      return node.callee.callee;
    }
  }

  // Eg. const Component = styled.div`${styles}`;
  if (node.type === 'TaggedTemplateExpression' && node.tag.type === 'MemberExpression') {
    return node.tag;
  }

  return;
};

/**
 * Given a rule, return the local name used to import the Styled API.
 *
 * @param context Rule context
 * @returns
 */
const getStyledImportSpecifierName = (context: RuleContext): string | undefined => {
  const compiledImports = findCompiledImportDeclarations(context);

  return compiledImports[0].specifiers.find(
    (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === 'styled'
  )?.local.name;
};

export const isStyledComponent = (nodes: Node[], context: RuleContext): boolean => {
  const node = findNode(nodes);

  if (!node) {
    return false;
  }

  const styledImportSpecifierName = getStyledImportSpecifierName(context);

  if (styledImportSpecifierName) {
    if (node.type === 'Identifier') {
      return node.name === styledImportSpecifierName;
    } else {
      return node.object.type === 'Identifier' && node.object.name === styledImportSpecifierName;
    }
  }

  return false;
};
