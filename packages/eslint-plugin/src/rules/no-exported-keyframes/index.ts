import type { Rule } from 'eslint';

import { createNoExportedRule, isKeyframes } from '../../utils';

export const noExportedKeyframesRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-exported-css',
    },
    messages: {
      unexpected: 'Unexpected `keyframes` export declaration from @compiled/react',
    },
    type: 'problem',
  },
  create: createNoExportedRule(isKeyframes, 'unexpected'),
};
