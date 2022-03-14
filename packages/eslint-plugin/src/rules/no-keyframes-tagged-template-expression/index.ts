import type { Rule } from 'eslint';

import { createNoTaggedTemplateExpressionRule } from '../../utils';

import { isKeyframes } from './utils';

export const noKeyframesTaggedTemplateExpressionRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-keyframes-tagged-template-expression',
    },
    fixable: 'code',
    messages: {
      noKeyframesTaggedTemplateExpression:
        'Encountered unexpected keyframes tagged template expression from @compiled/react',
    },
    type: 'problem',
  },
  create: createNoTaggedTemplateExpressionRule(isKeyframes, 'noKeyframesTaggedTemplateExpression'),
};
