import type { Rule } from 'eslint';

import { isCxFunction } from '../../utils';

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
          isCxFunction(node.callee as Rule.Node, context.getScope().references)
        ) {
          const parentJSXAttribute = getParentJSXAttribute(node);
          const propName = parentJSXAttribute?.name.name.toString();

          if (propName && /[xX]css$/.exec(propName)) {
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
