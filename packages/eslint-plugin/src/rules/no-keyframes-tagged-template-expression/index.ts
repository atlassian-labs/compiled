import type { Rule } from 'eslint';

import { createNoTaggedTemplateExpressionRule, isKeyframes } from '../../utils';

export const noKeyframesTaggedTemplateExpressionRule: Rule.RuleModule = {
  meta: {
    docs: {
      recommended: true,
      description: 'Disallows the `keyframes` tagged template expression',
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-keyframes-tagged-template-expression',
    },
    fixable: 'code',
    messages: {
      unexpected: 'Unexpected `keyframes` tagged template expression from @compiled/react',
    },
    type: 'problem',
  },
  create: createNoTaggedTemplateExpressionRule(isKeyframes, 'unexpected'),
};
