import type { Rule, SourceCode } from 'eslint';
import type { ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier } from 'estree';

import { findCompiledImportDeclarations, findDeclarationWithImport } from '../../utils/ast';
import { addImportToDeclaration, removeImportFromDeclaration } from '../../utils/ast-to-string';

type Options = {
  runtime: 'classic' | 'automatic';
};

const findReactDeclarationWithDefaultImport = (
  source: SourceCode
): [ImportDeclaration, ImportDefaultSpecifier | ImportNamespaceSpecifier] | undefined => {
  for (const statement of source.ast.body) {
    if (statement.type === 'ImportDeclaration' && statement.source.value === 'react') {
      const defaultSpecifier = statement.specifiers.find(
        (spec): spec is ImportDefaultSpecifier | ImportNamespaceSpecifier =>
          (spec.type === 'ImportDefaultSpecifier' || spec.type === 'ImportNamespaceSpecifier') &&
          spec.local.name === 'React'
      );
      if (defaultSpecifier) {
        return [statement, defaultSpecifier];
      }
    }
  }

  return undefined;
};

function createFixer(context: Rule.RuleContext, source: SourceCode, options: Options) {
  return function* fix(fixer: Rule.RuleFixer) {
    const pragma = options.runtime === 'classic' ? '@jsx jsx' : '@jsxImportSource @compiled/react';
    const reactImport = findReactDeclarationWithDefaultImport(source);
    if (reactImport) {
      const [declaration, defaultImport] = reactImport;
      const [defaultImportVariable] = context.getDeclaredVariables(defaultImport);

      if (defaultImportVariable && defaultImportVariable.references.length === 0) {
        if (declaration.specifiers.length === 1) {
          // Only the default specifier exists and it isn't used - remove the whole declaration!
          yield fixer.remove(declaration);
        } else {
          // Multiple specifiers exist but the default one isn't used - remove the default specifier!
          yield fixer.replaceText(declaration, removeImportFromDeclaration(declaration, []));
        }
      }
    }

    yield fixer.insertTextBefore(source.ast.body[0], `/** ${pragma} */\n`);

    const compiledImports = findCompiledImportDeclarations(context);

    if (options.runtime === 'classic' && !findDeclarationWithImport(compiledImports, 'jsx')) {
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
  };
}

export const jsxPragmaRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/jsx-pragma',
    },
    fixable: 'code',
    messages: {
      missingPragmaXCSS: 'Applying xcss prop to className requires the jsx pragma in scope.',
      missingPragma: 'To use the `css` prop you must set the {{ pragma }} pragma.',
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
    type: 'problem',
  },
  create(context) {
    const options: Options = context.options[0] || { runtime: 'automatic' };
    const source = context.getSourceCode();
    const comments = source.getAllComments();
    const jsxPragma = comments.find((n) => n.value.indexOf('@jsx jsx') > -1);
    const jsxImportSourcePragma = comments.find(
      (n) => n.value.indexOf('@jsxImportSource @compiled/react') > -1
    );

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

      'JSXOpeningElement[name.name=/^[a-z]+$/] > JSXAttribute[name.name=/^className$/]': (
        node: Rule.Node
      ) => {
        if (node.type !== 'JSXAttribute' || jsxPragma || jsxImportSourcePragma) {
          return;
        }

        if (
          node.value?.type === 'JSXExpressionContainer' &&
          node.value.expression.type === 'Identifier' &&
          /[Xx]css$/.test(node.value.expression.name)
        ) {
          context.report({
            node,
            messageId: 'missingPragmaXCSS',
            fix: createFixer(context, source, options),
          });
        }
      },

      JSXAttribute(node: any) {
        if (jsxPragma || jsxImportSourcePragma || node.name.name !== 'css') {
          return;
        }

        context.report({
          messageId: 'missingPragma',
          data: {
            pragma: options.runtime === 'classic' ? 'jsx' : 'jsxImportSource',
          },
          node,
          fix: createFixer(context, source, options),
        });
      },
    };
  },
};
