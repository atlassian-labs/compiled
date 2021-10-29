import type { Rule } from 'eslint';

import type { ImportSpecifier, ImportDeclaration } from 'estree';

const hasStyledImport = (node: ImportDeclaration) => node.source.value === '@emotion/styled';
const hasCoreImport = (node: ImportDeclaration) => node.source.value === '@emotion/core';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      recommended: true,
    },
    fixable: 'code',
    type: 'problem',
    messages: {
      noStyled: `The '@emotion/styled' library should no longer be in use. Use '@compiled/react'.`,
      noCore: `The '@emotion/core' library should no longer be in use. Use '@compiled/react'.`,
      noPragma: `The /** @jsx jsx */ pragma is not require in '@compiled/react'. It can be safely removed.`,
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
              return fixer.replaceText(pragma, "import * as React from 'react';");
            },
          });
        }
      },
      ImportDeclaration(node) {
        const hasStyled = hasStyledImport(node);
        const hasCore = hasCoreImport(node);

        if (hasStyled) {
          return context.report({
            messageId: 'noStyled',
            node: node.source,
            fix(fixer) {
              // const imports = context.getSourceCode().ast.body.filter(({ type }) => type === 'ImportDeclaration')
              return fixer.replaceText(
                node,
                `import { ${
                  node.specifiers[0].local.name === 'styled'
                    ? 'styled'
                    : `styled as ${node.specifiers[0].local.name}`
                } } from '@compiled/react';`
              );
            },
          });
        }

        if (hasCore) {
          return context.report({
            messageId: 'noCore',
            node: node.source,
            fix(fixer) {
              // need to bail out here
              if (node.specifiers[0].type === 'ImportNamespaceSpecifier') {
                return null;
              }

              const specifiers = node.specifiers.filter((x) => x.type === 'ImportSpecifier');

              return fixer.replaceText(
                node,
                `import { ${specifiers
                  .filter(
                    (localNode) =>
                      (localNode as ImportSpecifier).imported.name === 'css' ||
                      (localNode as ImportSpecifier).imported.name === 'ClassNames'
                  )
                  .map((localNode) =>
                    (localNode as ImportSpecifier).imported.name === localNode.local.name
                      ? localNode.local.name
                      : `${(localNode as ImportSpecifier).imported.name} as ${localNode.local.name}`
                  )
                  .join(', ')} } from '@compiled/react';`
              );
            },
          });
        }
      },
    };
  },
};

export default rule;
