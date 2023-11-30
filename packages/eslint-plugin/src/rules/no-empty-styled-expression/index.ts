import type { Rule } from 'eslint';
import type { CallExpression } from 'estree';

import { isStyledImportSpecifier } from '../../utils/styled-import';

type RuleModule = Rule.RuleModule;

const isEmptyStyledExpression = (node: CallExpression): boolean => {
  const [firstArg] = node.arguments;
  if (firstArg?.type === 'ObjectExpression') {
    return firstArg.properties.length === 0;
  }
  return true;
};

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

        context.report({
          messageId,
          node,
        });
      },
    };
  };

export const noEmptyStyledExpressionRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-empty-styled-expression',
    },
    messages: {
      unexpected:
        'Unexpected empty expression/empty object argument passed to styled.div() from @compiled/react',
    },
    type: 'problem',
  },
  create: createNoEmptyStyledExpressionRule(isEmptyStyledExpression, 'unexpected'),
};
