import type { Rule, Scope } from 'eslint';
import type { ObjectExpression } from 'estree';

import { COMPILED_IMPORT } from '../../utils/constants';

type Definition = Scope.Definition;
type Node = Rule.Node;
type Reference = Scope.Reference;
type RuleModule = Rule.RuleModule;

const isStyledImportSpecifier = (def: Definition) =>
  def.node.type === 'ImportSpecifier' &&
  def.node.imported.type === 'Identifier' &&
  def.node.imported.name === 'styled' &&
  def.parent?.type === 'ImportDeclaration' &&
  def.parent?.source.value === COMPILED_IMPORT;

const isEmptyStyledExpression = (node: Node, references: Reference[]): boolean =>
  (node.type === 'CallExpression' && // If it's a CallExpression > MemberExpression with null arguments and uses the styled import from Compiled
    node.callee.type === 'MemberExpression' &&
    node.arguments.length === 0 && // No arguments at all
    references.some((reference) => reference.resolved?.defs.some(isStyledImportSpecifier))) ||
  (node.type === 'CallExpression' && // If it's a CallExpression > MemberExpression with arguments but no properties
    node.callee.type === 'MemberExpression' &&
    node.arguments.map((obj) => {
      const object: ObjectExpression = obj as ObjectExpression;
      return Object.keys(object.properties).length === 0;
    }) && // The object passed as an argument itself is empty
    references.some((reference) => reference.resolved?.defs.some(isStyledImportSpecifier)));

/**
 * Creation of the rule to identify empty styled.div/span() calls and raise an error message
 * @param isEmptyStyledTag
 * @param messageId
 * @returns
 */
export const createNoStyledEmptyExpressionRule =
  (
    isEmptyStyledExpression: (node: Node, references: Reference[]) => boolean,
    messageId: string
  ): RuleModule['create'] =>
  (context) => ({
    CallExpression(node) {
      const { references } = context.getScope();
      if (!isEmptyStyledExpression(node, references)) {
        return;
      }

      // Prints the unexpected message for all CallExpression nodes that match the isEmptyStyledTag criteria
      context.report({
        messageId,
        node,
      });
    },
  });

/**
 * The module declaration for the No Styled Empty Expression rule.
 */
export const noStyledEmptyExpressionRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: '',
    },
    fixable: 'code',
    messages: {
      unexpected:
        'Unexpected empty expression/empty object argument passed to styled.div() from @compiled/react',
    },
    type: 'problem',
  },
  create: createNoStyledEmptyExpressionRule(isEmptyStyledExpression, 'unexpected'),
};
