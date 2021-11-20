import type { Rule } from 'eslint';
import type { ImportSpecifier, ImportDeclaration } from 'estree';
import { getNamedImports, wrapImport } from '../../utils/ast-string';

const COMPILED_IMPORT = '@compiled/react';

const rule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
    type: 'problem',
    messages: {
      preferJsxImportSource:
        'Use of the jsxImportSource pragma (automatic runtime) is preferred over the jsx pragma (classic runtime).',
    },
  },
  create(context) {
    return {
      Program() {
        const source = context.getSourceCode();
        const pragma = source.getAllComments().find((n) => n.value.includes('@jsx jsx'));
        const compiledJSXImport = source.ast.body.find((node): node is ImportDeclaration => {
          if (node.type === 'ImportDeclaration' && node.source.value === COMPILED_IMPORT) {
            const hasJsxImport = node.specifiers.find((specifier) => {
              return specifier.type === 'ImportSpecifier' && specifier.imported.name === 'jsx';
            });

            return !!hasJsxImport;
          }

          return false;
        });

        if (pragma && compiledJSXImport) {
          return context.report({
            messageId: 'preferJsxImportSource',
            loc: pragma.loc!,
            *fix(fixer) {
              yield fixer.replaceText(pragma as any, '/** @jsxImportSource @compiled/react */');

              const specifiers = compiledJSXImport.specifiers.filter(
                (specifier): specifier is ImportSpecifier =>
                  specifier.type === 'ImportSpecifier' && specifier.imported.name !== 'jsx'
              );

              if (specifiers.length) {
                const specifiersString = specifiers.map(getNamedImports).join(', ');
                yield fixer.replaceText(
                  compiledJSXImport,
                  wrapImport(specifiersString, COMPILED_IMPORT)
                );
              } else {
                yield fixer.remove(compiledJSXImport);
              }
            },
          });
        }
      },
    };
  },
};

export default rule;
