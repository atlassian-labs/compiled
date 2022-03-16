import type { Rule } from 'eslint';

import { createNoTaggedTemplateExpressionRule } from '../../utils';

import { isCss } from './utils';

export const noCssTaggedTemplateExpressionRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-css-tagged-template-expression',
    },
    fixable: 'code',
    messages: {
      noCssTaggedTemplateExpression:
        'Encountered unexpected css tagged template expression from @compiled/react',
    },
    type: 'problem',
  },
  create: createNoTaggedTemplateExpressionRule(isCss, 'noCssTaggedTemplateExpression'),
};
