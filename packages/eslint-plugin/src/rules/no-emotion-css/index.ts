import type { Rule } from 'eslint';
import type { ImportSpecifier, ImportDeclaration } from 'eslint-codemod-utils';
import {
  importDeclaration,
  isNodeOfType,
  insertImportSpecifier,
  importSpecifier,
  literal,
  identifier,
  hasImportDeclaration,
} from 'eslint-codemod-utils';

const COMPILED_IMPORT = '@compiled/react';
const ALLOWED_EMOTION_IMPORTS = ['css', 'keyframes', 'ClassNames', 'jsx'];

/**
 * Given a rule, return any `@compiled/react` nodes in the source being parsed.
 *
 * @param context Rule context
 * @returns {Rule.Node} The `@compiled/react` node or undefined
 */
const getCompiledNode = (context: Rule.RuleContext) => {
  return context
    .getSourceCode()
    .ast.body.filter((node): node is ImportDeclaration => node.type === 'ImportDeclaration')
    .find((node) => node.source.value === COMPILED_IMPORT);
};

export const noEmotionCssRule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
    type: 'problem',
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-emotion-css',
    },
    messages: {
      noEmotionCSS: `{{ version }} should not be used use ${COMPILED_IMPORT} instead.`,
    },
  },
  create(context) {
    return {
      Program() {
        const pragma = context
          .getSourceCode()
          .getAllComments()
          .find((n) => n.value.includes('@jsxImportSource @emotion/react'));

        if (pragma) {
          return context.report({
            messageId: 'noEmotionCSS',
            data: {
              version: '@emotion/react',
            },
            loc: pragma.loc!,
            fix(fixer) {
              return fixer.replaceText(pragma as any, '/** @jsxImportSource @compiled/react */');
            },
          });
        }
      },
      ImportDeclaration(node) {
        if (node.specifiers[0] && isNodeOfType(node.specifiers[0], 'ImportNamespaceSpecifier')) {
          return;
        }

        const hasStyled = hasImportDeclaration(node, '@emotion/styled');
        const hasCore =
          hasImportDeclaration(node, '@emotion/core') ||
          hasImportDeclaration(node, '@emotion/react');

        if (hasStyled) {
          context.report({
            messageId: 'noEmotionCSS',
            data: {
              version: node.source.value as string,
            },
            node: node.source,
            *fix(fixer) {
              const compiledNode = getCompiledNode(context);
              if (compiledNode) {
                yield fixer.remove(node);
                yield fixer.replaceText(
                  compiledNode,
                  `${insertImportSpecifier(
                    compiledNode,
                    'styled',
                    node.specifiers[0].local.name !== 'styled'
                      ? node.specifiers[0].local.name
                      : undefined
                  )};`
                );
              } else {
                yield fixer.replaceText(
                  node,
                  `${importDeclaration({
                    source: literal(COMPILED_IMPORT),
                    specifiers: [
                      importSpecifier({ ...node.specifiers[0], imported: identifier('styled') }),
                    ],
                  })};`
                );
              }
            },
          });
        }

        if (hasCore) {
          context.report({
            messageId: 'noEmotionCSS',
            data: {
              version: node.source.value as string,
            },
            node: node.source,
            *fix(fixer) {
              const compiledNode = getCompiledNode(context);
              const specifiers = node.specifiers
                .filter(
                  (specifier): specifier is ImportSpecifier => specifier.type === 'ImportSpecifier'
                )
                .filter((specifier) => ALLOWED_EMOTION_IMPORTS.includes(specifier.imported.name));

              if (!specifiers.length) {
                yield fixer.remove(node);
                return;
              }

              if (compiledNode) {
                yield fixer.remove(node);
                yield fixer.replaceText(
                  compiledNode,
                  `${importDeclaration({
                    ...compiledNode,
                    specifiers: compiledNode.specifiers.concat(specifiers),
                  })};`
                );
              } else {
                yield fixer.replaceText(
                  node,
                  `${importDeclaration({
                    specifiers,
                    source: literal(COMPILED_IMPORT),
                  })};`
                );
              }
            },
          });
        }
      },
    };
  },
};
