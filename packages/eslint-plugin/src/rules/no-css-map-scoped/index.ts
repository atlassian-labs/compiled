import { DEFAULT_IMPORT_SOURCES } from '@compiled/utils';
import type { Rule } from 'eslint';

import { getScope, getSourceCode } from '../../utils/context-compat.js';
import { isCssMapScoped } from '../../utils/index.js';

export const noCssMapScopedRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      url: 'https://compiledcssinjs.com/docs/eslint-plugin-no-css-map-scoped',
      description:
        '`cssMapScoped` is an experimental internal API. It is not part of the public `@compiled/react` API and should only be used with explicit approval from the Compiled team.',
      recommended: true,
    },
    messages: {
      noCssMapScoped:
        '`cssMapScoped` is experimental and restricted. Use `cssMap` for standard atomic CSS map output, or contact the Compiled team for approval to use `cssMapScoped`.',
    },
    schema: [],
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
        if (isCssMapScoped(node.callee as Rule.Node, references)) {
          context.report({ node, messageId: 'noCssMapScoped' });
        }
      },
    };
  },
};
