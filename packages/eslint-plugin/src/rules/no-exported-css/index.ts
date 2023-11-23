import type { Rule } from 'eslint';

import { createNoExportedRule, isCss } from '../../utils';

export const noExportedCssRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-exported-css',
    },
    messages: {
      unexpected:
        "`css` can't be exported - this will cause unexpected behaviour at runtime. Instead, please move your `css(...)` code to the same file where these styles are being used.",
    },
    type: 'problem',
  },
  create: createNoExportedRule(isCss, 'unexpected'),
};
