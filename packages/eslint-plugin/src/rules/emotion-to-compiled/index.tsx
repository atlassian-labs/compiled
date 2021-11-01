import type { Rule } from 'eslint';

import type { ImportSpecifier, ImportDeclaration } from 'estree';

const hasStyledImport = (node: ImportDeclaration) => node.source.value === '@emotion/styled';
const hasCoreImport = (node: ImportDeclaration) =>
  ['@emotion/core', '@emotion/react'].includes(node.source.value as string);
const getNamedImports = (node: ImportSpecifier) => {
  return node.imported.name === node.local.name
    ? node.local.name
    : `${node.imported.name} as ${node.local.name}`;
};

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
      (node) => (node as ImportDeclaration).source.value === '@compiled/react'
    ) as ImportDeclaration;
};

const rule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
    type: 'problem',
    messages: {
      noStyled: `The '@emotion/styled' library should not be used. Use '@compiled/react' instead.`,
      noCore: `The {{ version }} library should not be used. Use '@compiled/react' instead.`,
      noPragma: `The /** @jsx jsx */ pragma is not required in '@compiled/react'. It can be safely removed.`,
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
                yield fixer.replaceText(
                  compiledNode,
                  `import { ${
                    // @ts-ignore
                    compiledNode.specifiers.map(getNamedImports).concat(specifiers).join(', ')
                  } } from '@compiled/react';`
                );
              } else {
                yield fixer.replaceText(node, `import { ${specifiers} } from '@compiled/react';`);
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
                  `import { ${
                    // @ts-ignore
                    compiledNode.specifiers.concat(specifiers).map(getNamedImports).join(', ')
                  } } from '@compiled/react';`
                );
              } else {
                yield fixer.replaceText(
                  node,
                  `import { ${specifiers.map(getNamedImports).join(', ')} } from '@compiled/react';`
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
