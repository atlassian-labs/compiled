import type { Rule } from 'eslint';

import { createNoExportedRule, isCss } from '../../utils';

export const noExportedCssRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-exported-css',
    },
    messages: {
      unexpected: 'Unexpected `css` export declaration from @compiled/react',
    },
    type: 'problem',
  },
  create: createNoExportedRule(isCss, 'unexpected'),
};
