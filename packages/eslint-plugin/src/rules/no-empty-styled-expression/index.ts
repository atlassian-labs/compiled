import type { Rule } from 'eslint';
import type { CallExpression } from 'estree';

import { isStyledImportSpecifier } from '../../utils/styled-import';

type RuleModule = Rule.RuleModule;

const isEmptyStyledExpression = (node: CallExpression): boolean => {
  const [firstArg] = node.arguments;
  if (firstArg?.type === 'ObjectExpression') {
    // Check if it has properties. If empty, return true.
    return firstArg.properties.length === 0;
  }
  return true;
};

/**
 * Creation of the rule to identify empty styled.div/span() calls and raise an error message
 * @param isEmptyStyledTag
 * @param messageId
 * @returns
 */
export const createNoEmptyStyledExpressionRule =
  (
    isEmptyStyledExpression: (node: CallExpression) => boolean,
    messageId: string
  ): RuleModule['create'] =>
  (context) => {
    return {
      'CallExpression[callee.type="MemberExpression"]': (node: CallExpression) => {
        const { references } = context.getScope();

        const isStyledImported = references.some((reference) =>
          reference.resolved?.defs.some(isStyledImportSpecifier)
        );
        if (!isStyledImported) {
          return;
        }

        if (!isEmptyStyledExpression(node)) {
          return;
        }

        // Prints the unexpected message for all CallExpression nodes that match the isEmptyStyledTag criteria
        context.report({
          messageId,
          node,
        });
      },
    };
  };

/**
 * The module declaration for the No Styled Empty Expression rule.
 */
export const noEmptyStyledExpressionRule: Rule.RuleModule = {
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
  create: createNoEmptyStyledExpressionRule(isEmptyStyledExpression, 'unexpected'),
};
