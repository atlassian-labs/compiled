import type { Rule } from 'eslint';

export const noSuppressXCSS: Rule.RuleModule = {
  meta: {
    docs: {
      recommended: true,
      description:
        'The xcss prop is predicated on adhering to the type contract. Supressing it breaks this contract and thus is not allowed.',
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-supress-xcss',
    },
    messages: {
      'no-suppress-xcss': 'bad!',
    },
    type: 'problem',
  },
  create(context) {
    return {
      'JSXAttribute[name.name=/[xX]css$/]': (node: Rule.Node) => {
        if (!node.loc) {
          return;
        }

        const comments = context.sourceCode.getAllComments();

        for (let i = 0; i < comments.length; i++) {
          const comment = comments[i];
          if (!comment.loc) {
            continue;
          }

          const commentLine = comment.loc.start.line;
          const nodeLine = node.loc.start.line;
          const isCommentOnPreviousLine = nodeLine - 1 === commentLine;

          if (
            isCommentOnPreviousLine &&
            ['@ts-expect-error', '@ts-ignore'].some((tag) => comment.value.includes(tag))
          ) {
            context.report({
              node,
              messageId: 'no-suppress-xcss',
            });
          }
        }
      },
    };
  },
};
