import type { Rule } from 'eslint';
import type { MemberExpression } from 'estree';

import { findCompiledImportDeclarations } from '../ast';

type Node = Rule.Node;
type RuleContext = Rule.RuleContext;

/**
 * Returns the MemberExpression node that could define a Compiled component
 *
 * @param nodes
 * @returns
 */
const findMemberExpressionNode = (nodes: Node[]): MemberExpression | undefined => {
  const node = nodes.find(
    (n) => n.type === 'TaggedTemplateExpression' || n.type === 'CallExpression'
  );

  // Eg. const Component = styled.button(style)
  if (node && node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
    return node.callee;
  }

  // Eg. const Component = styled.div`${styles}`;
  if (node && node.type === 'TaggedTemplateExpression' && node.tag.type === 'MemberExpression') {
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
  const node = findMemberExpressionNode(nodes);

  if (node) {
    const styledImportSpecifierName = getStyledImportSpecifierName(context);

    if (styledImportSpecifierName) {
      return node.object.type === 'Identifier' && node.object.name === styledImportSpecifierName;
    }
  }

  return false;
};
