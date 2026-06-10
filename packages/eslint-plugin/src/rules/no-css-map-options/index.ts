import { DEFAULT_IMPORT_SOURCES } from '@compiled/utils';
import type { Rule } from 'eslint';

import { isCssMap } from '../../utils';
import { getScope, getSourceCode } from '../../utils/context-compat';

export const noCssMapOptionsRule: Rule.RuleModule = {
  meta: {
    docs: {
      recommended: true,
      description:
        'Disallows passing options to `cssMap`. Configuration options like `atomic` are experimental and for internal use only.',
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-css-map-options',
    },
    messages: {
      noCssMapOptions:
        'cssMap does not accept options. Configuration options like atomic are experimental and for internal use only, only use with extreme caution.',
    },
    type: 'problem',
  },
  create(context) {
    const { text } = getSourceCode(context);

    // Bail out early if no compiled imports are present
    if (DEFAULT_IMPORT_SOURCES.every((source) => !text.includes(source))) {
      return {};
    }

    return {
      CallExpression(node) {
        const references = getScope(context, node).references;
        if (!isCssMap(node.callee as Rule.Node, references)) return;
        if (node.arguments.length > 1) {
          context.report({ node: node.arguments[1], messageId: 'noCssMapOptions' });
        }
      },
    };
  },
};
