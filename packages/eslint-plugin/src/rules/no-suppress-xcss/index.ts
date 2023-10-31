import type { Rule } from 'eslint';

export const noSuppressXCSS: Rule.RuleModule = {
  meta: {
    docs: {
      recommended: true,
      description:
        'The xcss prop is predicated on adhering to the type contract. Supressing it breaks this contract and thus is not allowed.',
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-supress-xcss',
    },
    messages: {},
    type: 'problem',
  },
  create() {
    return {};
  },
};
