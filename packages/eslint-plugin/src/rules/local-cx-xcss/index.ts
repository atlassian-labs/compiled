import type { Rule } from 'eslint';

import { isCxFunction } from '../../utils';
import { getScope } from '../../utils/context-compat';

function getParentJSXAttribute(node: Rule.Node) {
  let parent: Rule.Node | null = node.parent;

  while (parent && parent.type !== 'JSXAttribute') {
    parent = parent.parent;
  }

  if (parent && parent.type === 'JSXAttribute') {
    return parent;
  }

  return null;
}

export const localCXXCSSRule: Rule.RuleModule = {
  meta: {
    docs: {
      description: 'Ensures the `cx()` function is only used within the `xcss` prop',
      recommended: true,
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/local-cx-xcss',
    },
    messages: {
      'local-cx-xcss':
        'The cx function should only be declared inside the xcss prop to simplify tracking styles that are applied to a jsx element',
    },
    type: 'problem',
  },
  create(context) {
    return {
      'CallExpression[callee.name="cx"]': (node: Rule.Node) => {
        if (
          node.type === 'CallExpression' &&
          isCxFunction(node.callee as Rule.Node, getScope(context, node).references)
        ) {
          const parentJSXAttribute = getParentJSXAttribute(node);
          const propName = parentJSXAttribute?.name.name.toString();

          if (propName && /[xX]css$/.test(propName)) {
            return;
          }

          context.report({
            node,
            messageId: 'local-cx-xcss',
          });
        }
      },
    };
  },
};
