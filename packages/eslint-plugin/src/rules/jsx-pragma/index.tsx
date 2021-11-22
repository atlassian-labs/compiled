import type { Rule } from 'eslint';
import type { ImportSpecifier, ImportDeclaration } from 'estree';
import {
  buildNamedImport,
  buildImportDeclaration,
  addImportToDeclaration,
} from '../../utils/ast-string';

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

type Options = {
  pragma: 'jsx' | 'jsxImportSource';
};

const rule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
    type: 'problem',
    messages: {
      missingPragma: 'The {{ pragma }} pragma is missing.',
      preferJsxImportSource:
        'Use of the jsxImportSource pragma (automatic runtime) is preferred over the jsx pragma (classic runtime).',
      preferJsx:
        'Use of the jsx pragma (classic runtime) is preferred over the jsx pragma (automatic runtime).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          pragma: {
            type: 'string',
            pattern: '^(jsx|jsxImportSource)$',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options: Options = context.options[0] || { pragma: 'jsxImportSource' };
    const source = context.getSourceCode();
    const jsxPragma = source.getAllComments().find((n) => n.value.includes('@jsx jsx'));
    const jsxImportSourcePragma = source
      .getAllComments()
      .find((n) => n.value.includes('@jsxImportSource @compiled/react'));

    return {
      Program() {
        const compiledJSXImport = source.ast.body.find((node): node is ImportDeclaration => {
          if (node.type === 'ImportDeclaration' && node.source.value === COMPILED_IMPORT) {
            const hasJsxImport = node.specifiers.find((specifier) => {
              return specifier.type === 'ImportSpecifier' && specifier.imported.name === 'jsx';
            });

            return !!hasJsxImport;
          }

          return false;
        });

        if (jsxPragma && options.pragma === 'jsxImportSource' && compiledJSXImport) {
          return context.report({
            messageId: 'preferJsxImportSource',
            loc: jsxPragma.loc!,
            *fix(fixer) {
              yield fixer.replaceText(jsxPragma as any, '/** @jsxImportSource @compiled/react */');

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
          if (!jsxPragma && !jsxImportSourcePragma) {
            const compiledImports = findCompiledImportDeclarations(context);
            const pragma =
              options.pragma === 'jsx' ? '@jsx jsx' : '@jsxImportSource @compiled/react';

            context.report({
              messageId: 'missingPragma',
              data: {
                pragma: options.pragma,
              },
              loc: { column: 1, line: 1 },
              *fix(fixer) {
                yield fixer.insertTextBefore(source.ast.body[0], `/** ${pragma} */\n`);

                if (
                  options.pragma === 'jsx' &&
                  !compiledImports.find((imp) =>
                    imp.specifiers.find(
                      (spec): spec is ImportSpecifier =>
                        spec.type === 'ImportSpecifier' && spec.imported.name === 'jsx'
                    )
                  )
                ) {
                  // jsx import is missing time to add one
                  if (compiledImports.length === 0) {
                    // No import exists, add a new one!
                    yield fixer.insertTextBefore(
                      source.ast.body[0],
                      "import { jsx } from '@compiled/react';\n"
                    );
                  } else {
                    // An import exists with no JSX! Let's add one to the first found.
                    const [firstCompiledImport] = compiledImports;

                    yield fixer.replaceText(
                      firstCompiledImport,
                      addImportToDeclaration(firstCompiledImport, ['jsx'])
                    );
                  }
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
