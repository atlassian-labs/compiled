import type { Rule } from 'eslint';
import type { ImportSpecifier, ImportDeclaration } from 'estree';
import { buildNamedImport, buildImportDeclaration } from '../../utils/ast-string';

const COMPILED_IMPORT = '@compiled/react';

/**
 * Given a rule, return any `@compiled/react` nodes in the source being parsed.
 *
 * @param context Rule context
 * @returns {Rule.Node} The `@compiled/react` node or undefined
 */
const findCompiledImportDeclarations = (context: Rule.RuleContext) => {
  return context
    .getSourceCode()
    .ast.body.filter(
      (node): node is ImportDeclaration =>
        node.type === 'ImportDeclaration' && node.source.value === COMPILED_IMPORT
    );
};

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
                const specifiersString = specifiers.map(buildNamedImport).join(', ');
                yield fixer.replaceText(
                  compiledJSXImport,
                  buildImportDeclaration(specifiersString, COMPILED_IMPORT)
                );
              } else {
                yield fixer.remove(compiledJSXImport);
              }
            },
          });
        }
      },

      JSXAttribute(node: any) {
        if (node.name.type === 'JSXIdentifier' && node.name.name === 'css') {
          const source = context.getSourceCode();
          const pragma = source.getAllComments().find((n) => n.value.includes('@jsx jsx'));
          const compiledImports = findCompiledImportDeclarations(context);

          if (!pragma && compiledImports.length) {
            context.report({
              messageId: 'missingPragma',
              node,
              *fix(fixer) {
                yield fixer.insertTextBefore(source.ast.body[0], '/** @jsx jsx */\n');

                if (
                  !compiledImports.find((imp) =>
                    imp.specifiers.find(
                      (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === 'jsx'
                    )
                  )
                ) {
                  // jsx import is missing time to add one
                  console.log('hi');
                }
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
