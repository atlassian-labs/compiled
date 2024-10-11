import type { Rule } from 'eslint';

import { createNoTaggedTemplateExpressionRule, isStyled } from '../../utils';

export const noStyledTaggedTemplateExpressionRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-styled-tagged-template-expression',
    },
    fixable: 'code',
    messages: {
      unexpected: 'Unexpected `styled` tagged template expression from @compiled/react',
    },
    type: 'problem',
  },
  create: createNoTaggedTemplateExpressionRule(isStyled, 'unexpected'),
};
