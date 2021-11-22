import type { Rule } from 'eslint';
import { addImportToDeclaration, removeImportFromDeclaration } from '../../utils/ast-string';
import { findCompiledImportDeclarations, findDeclarationWithImport } from '../../utils/ast';

type Options = {
  pragma: 'jsx' | 'jsxImportSource';
};

const START_OF_FILE_LOC = { line: 1, column: 0 };

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
    if (source.text.indexOf('css={') === -1) {
      // Bail early nothing to check here.
      return {};
    }

    const jsxPragma = source.getAllComments().find((n) => n.value.indexOf('@jsx jsx') > -1);

    const jsxImportSourcePragma = source
      .getAllComments()
      .find((n) => n.value.indexOf('@jsxImportSource @compiled/react') > -1);

    return {
      Program() {
        if (jsxPragma && options.pragma === 'jsxImportSource') {
          return context.report({
            messageId: 'preferJsxImportSource',
            loc: jsxPragma.loc || START_OF_FILE_LOC,
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

        if (jsxImportSourcePragma && options.pragma === 'jsx') {
          return context.report({
            messageId: 'preferJsx',
            loc: jsxImportSourcePragma.loc || START_OF_FILE_LOC,
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

        if (!jsxPragma && !jsxImportSourcePragma) {
          const pragma = options.pragma === 'jsx' ? '@jsx jsx' : '@jsxImportSource @compiled/react';

          context.report({
            messageId: 'missingPragma',
            data: {
              pragma: options.pragma,
            },
            loc: START_OF_FILE_LOC,
            *fix(fixer) {
              yield fixer.insertTextBefore(source.ast.body[0], `/** ${pragma} */\n`);

              const compiledImports = findCompiledImportDeclarations(context);

              if (options.pragma === 'jsx' && !findDeclarationWithImport(compiledImports, 'jsx')) {
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
      },
    };
  },
};

export default rule;
