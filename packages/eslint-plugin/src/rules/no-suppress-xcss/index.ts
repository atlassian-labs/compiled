import type { Rule } from 'eslint';

import { getSourceCode } from '../../utils/context-compat';

function nodeIsTypeSuppressed(context: Rule.RuleContext, node: Rule.Node) {
  if (!node.loc) {
    return;
  }

  const comments = getSourceCode(context).getAllComments();

  for (const comment of comments) {
    if (!comment.loc) {
      continue;
    }

    const commentLine = comment.loc.start.line;
    const nodeLine = node.loc.start.line;
    const isCommentOnPreviousLine = nodeLine - 1 === commentLine;

    if (
      isCommentOnPreviousLine &&
      ['@ts-expect-error', '@ts-ignore', '@ts-nocheck'].some((tag) => comment.value.includes(tag))
    ) {
      return true;
    }
  }

  return false;
}

function getParentJSXAttribute(node: Rule.Node) {
  let parent: Rule.Node | null = node.parent;

  while (parent && parent.type !== 'JSXAttribute') {
    parent = parent.parent;
  }

  return parent;
}

export const noSuppressXCSS: Rule.RuleModule = {
  meta: {
    docs: {
      recommended: true,
      description:
        'The xcss prop is predicated on adhering to the type contract. Supressing it breaks this contract and thus is not allowed.',
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-supress-xcss',
    },
    messages: {
      'no-suppress-xcss':
        'Supressing type violations inside xcss risks incidents and unintended behaviour when code changes — only declare allowed values',
    },
    type: 'problem',
  },
  create(context) {
    const violations = new WeakSet<Rule.Node>();

    return {
      'JSXAttribute[name.name=/[xX]css$/] Property': (node: Rule.Node) => {
        const parent = getParentJSXAttribute(node);

        if (!violations.has(parent) && nodeIsTypeSuppressed(context, node)) {
          context.report({
            node: node,
            messageId: 'no-suppress-xcss',
          });
        }
      },
      'JSXAttribute[name.name=/[xX]css$/]': (node: Rule.Node) => {
        if (node.type === 'JSXAttribute' && nodeIsTypeSuppressed(context, node)) {
          violations.add(node);
          context.report({
            node: node.name,
            messageId: 'no-suppress-xcss',
          });
        }
      },
    };
  },
};
