import type { Rule } from 'eslint';

import { findCompiledImportDeclarations, findDeclarationWithImport } from '../../utils/ast';
import { addImportToDeclaration, removeImportFromDeclaration } from '../../utils/ast-string';

type Options = {
  runtime: 'classic' | 'automatic';
};

const rule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
    type: 'problem',
    messages: {
      missingPragma: 'To use CSS prop you must set the {{ pragma }} pragma.',
      preferJsxImportSource:
        'Use of the jsxImportSource pragma (automatic runtime) is preferred over the jsx pragma (classic runtime).',
      preferJsx:
        'Use of the jsx pragma (classic runtime) is preferred over the jsx pragma (automatic runtime).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          runtime: {
            type: 'string',
            pattern: '^(classic|automatic)$',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options: Options = context.options[0] || { runtime: 'automatic' };
    const source = context.getSourceCode();
    const jsxPragma = source.getAllComments().find((n) => n.value.indexOf('@jsx jsx') > -1);
    const jsxImportSourcePragma = source
      .getAllComments()
      .find((n) => n.value.indexOf('@jsxImportSource @compiled/react') > -1);

    return {
      Program() {
        if (jsxPragma && options.runtime === 'automatic') {
          return context.report({
            messageId: 'preferJsxImportSource',
            loc: jsxPragma.loc!,
            *fix(fixer) {
              yield fixer.replaceText(jsxPragma as any, '/** @jsxImportSource @compiled/react */');

              const compiledImports = findCompiledImportDeclarations(context);
              const jsxImport = findDeclarationWithImport(compiledImports, 'jsx');
              if (!jsxImport) {
                return;
              }

              if (jsxImport.specifiers.length) {
                const specifiersString = removeImportFromDeclaration(jsxImport, ['jsx']);
                if (specifiersString.length === 0) {
                  yield fixer.remove(jsxImport);
                } else {
                  yield fixer.replaceText(jsxImport, specifiersString);
                }
              } else {
                yield fixer.remove(jsxImport);
              }
            },
          });
        }

        if (jsxImportSourcePragma && options.runtime === 'classic') {
          return context.report({
            messageId: 'preferJsx',
            loc: jsxImportSourcePragma.loc!,
            *fix(fixer) {
              yield fixer.replaceText(jsxImportSourcePragma as any, '/** @jsx jsx */');

              const compiledImports = findCompiledImportDeclarations(context);
              const jsxImport = findDeclarationWithImport(compiledImports, 'jsx');
              if (jsxImport) {
                return;
              }

              if (compiledImports.length) {
                const [firstCompiledImport] = compiledImports;
                const specifiersString = addImportToDeclaration(firstCompiledImport, ['jsx']);

                yield fixer.replaceText(firstCompiledImport, specifiersString);
              } else {
                yield fixer.insertTextBefore(
                  source.ast.body[0],
                  "import { jsx } from '@compiled/react';\n"
                );
              }
            },
          });
        }
      },

      JSXAttribute(node: any) {
        if (jsxPragma || jsxImportSourcePragma || node.name.name !== 'css') {
          return;
        }

        const pragma =
          options.runtime === 'classic' ? '@jsx jsx' : '@jsxImportSource @compiled/react';

        context.report({
          messageId: 'missingPragma',
          data: {
            pragma: options.runtime === 'classic' ? 'jsx' : 'jsxImportSource',
          },
          node,
          *fix(fixer) {
            yield fixer.insertTextBefore(source.ast.body[0], `/** ${pragma} */\n`);

            const compiledImports = findCompiledImportDeclarations(context);

            if (
              options.runtime === 'classic' &&
              !findDeclarationWithImport(compiledImports, 'jsx')
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
      },
    };
  },
};

export default rule;
