import type { Rule } from 'eslint';

import { createNoExportedRule, isKeyframes } from '../../utils';

export const noExportedKeyframesRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-exported-css',
    },
    messages: {
      unexpected:
        "`keyframes` can't be exported - this will cause unexpected behaviour at runtime. Instead, please move your `keyframes(...)` code to the same file where these styles are being used.",
    },
    type: 'problem',
  },
  create: createNoExportedRule(isKeyframes, 'unexpected'),
};
