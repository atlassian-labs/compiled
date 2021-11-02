import type { Rule } from 'eslint';

import type { ImportSpecifier, ImportDeclaration } from 'estree';

const COMPILED_IMPORT = '@compiled/react';

const hasStyledImport = (node: ImportDeclaration) => node.source.value === '@emotion/styled';
const hasCoreImport = (node: ImportDeclaration) =>
  ['@emotion/core', '@emotion/react'].includes(node.source.value as string);
const getNamedImports = (node: ImportSpecifier) => {
  return node.imported.name === node.local.name
    ? node.local.name
    : `${node.imported.name} as ${node.local.name}`;
};
const wrapImport = (node: string) => `import { ${node} } from '${COMPILED_IMPORT}';`;

/**
 * Given a rule, return any `@compiled/react` nodes in the source being parsed.
 *
 * @param context Rule context
 * @returns {Rule.Node} The `@compiled/react` node or undefined
 */
const getCompiledNode = (context: Rule.RuleContext) => {
  return context
    .getSourceCode()
    .ast.body.filter((node) => node.type === 'ImportDeclaration')
    .find(
      (node) => (node as ImportDeclaration).source.value === COMPILED_IMPORT
    ) as ImportDeclaration;
};

const rule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
    type: 'problem',
    messages: {
      noStyled: `The '@emotion/styled' library should not be used. Use ${COMPILED_IMPORT} instead.`,
      noCore: `The {{ version }} library should not be used. Use ${COMPILED_IMPORT} instead.`,
      noPragma: `The /** @jsx jsx */ pragma is not required in ${COMPILED_IMPORT}. It can be safely removed.`,
    },
  },
  create(context) {
    return {
      Program() {
        const pragma = context
          .getSourceCode()
          .getAllComments()
          .find((n) => n.value === '* @jsx jsx ');
        if (pragma) {
          return context.report({
            messageId: 'noPragma',
            loc: pragma.loc!,
            fix(fixer) {
              return fixer.replaceText(pragma as any, "import * as React from 'react';");
            },
          });
        }
      },
      ImportDeclaration(node) {
        if (node.specifiers[0].type === 'ImportNamespaceSpecifier') {
          return null;
        }

        const hasStyled = hasStyledImport(node);

        if (hasStyled) {
          return context.report({
            messageId: 'noStyled',
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
                  // @ts-expect-error
                  .map(getNamedImports)
                  .concat(specifiers)
                  .join(', ');
                yield fixer.replaceText(compiledNode, wrapImport(allSpecifiers));
              } else {
                yield fixer.replaceText(node, wrapImport(specifiers));
              }
            },
          });
        }

        const hasCore = hasCoreImport(node);

        if (hasCore) {
          return context.report({
            messageId: 'noCore',
            data: {
              version: node.source.value as string,
            },
            node: node.source,
            *fix(fixer) {
              const compiledNode = getCompiledNode(context);
              const specifiers = (
                node.specifiers.filter(
                  (specifier) => specifier.type === 'ImportSpecifier'
                ) as ImportSpecifier[]
              ).filter(
                (specifier) =>
                  specifier.imported.name === 'css' || specifier.imported.name === 'ClassNames'
              );

              if (!specifiers.length) {
                yield fixer.remove(node);
                return;
              }

              if (compiledNode) {
                yield fixer.remove(node);
                yield fixer.replaceText(
                  compiledNode,
                  wrapImport(
                    // @ts-expect-error
                    compiledNode.specifiers.concat(specifiers).map(getNamedImports).join(', ')
                  )
                );
              } else {
                yield fixer.replaceText(
                  node,
                  wrapImport(specifiers.map(getNamedImports).join(', '))
                );
              }

              return;
            },
          });
        }
      },
    };
  },
};

export default rule;
