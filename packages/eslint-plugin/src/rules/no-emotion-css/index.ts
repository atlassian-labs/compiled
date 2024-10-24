import { COMPILED_IMPORT } from '@compiled/utils';
import type { Rule } from 'eslint';
import type { ImportSpecifier, ImportDeclaration } from 'estree';

import { buildImportDeclaration, buildNamedImport } from '../../utils/ast-to-string';

const ALLOWED_EMOTION_IMPORTS = ['css', 'keyframes', 'ClassNames', 'jsx'];

const isEmotionStyledImport = (node: ImportDeclaration) => node.source.value === '@emotion/styled';

const isEmotionImport = (node: ImportDeclaration) =>
  ['@emotion/core', '@emotion/react'].includes(node.source.value as string);

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
      description: 'Disallows `@emotion` usages',
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
              return fixer.replaceText(pragma as any, `/** @jsxImportSource ${COMPILED_IMPORT} */`);
            },
          });
        }
      },
      ImportDeclaration(node) {
        if (node.specifiers[0]?.type === 'ImportNamespaceSpecifier') {
          return;
        }

        const hasStyled = isEmotionStyledImport(node);
        const hasCore = isEmotionImport(node);

        if (hasStyled) {
          context.report({
            messageId: 'noEmotionCSS',
            data: {
              version: node.source.value as string,
            },
            node: node.source,
            *fix(fixer) {
              const compiledNode = getCompiledNode(context);
              const specifiers =
                node.specifiers[0].local.name === 'styled'
                  ? 'styled'
                  : `styled as ${node.specifiers[0].local.name}`;

              if (compiledNode) {
                yield fixer.remove(node);
                const allSpecifiers = compiledNode.specifiers
                  .map(buildNamedImport)
                  .concat(specifiers)
                  .join(', ');
                yield fixer.replaceText(
                  compiledNode,
                  buildImportDeclaration(allSpecifiers, COMPILED_IMPORT)
                );
              } else {
                yield fixer.replaceText(node, buildImportDeclaration(specifiers, COMPILED_IMPORT));
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
                  buildImportDeclaration(
                    compiledNode.specifiers.concat(specifiers).map(buildNamedImport).join(', '),
                    COMPILED_IMPORT
                  )
                );
              } else {
                yield fixer.replaceText(
                  node,
                  buildImportDeclaration(
                    specifiers.map(buildNamedImport).join(', '),
                    COMPILED_IMPORT
                  )
                );
              }
            },
          });
        }
      },
    };
  },
};
