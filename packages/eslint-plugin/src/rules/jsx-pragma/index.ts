import { COMPILED_IMPORT, DEFAULT_IMPORT_SOURCES } from '@compiled/utils';
import type { Rule, SourceCode } from 'eslint';
import type { ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier } from 'estree';

import {
  findDeclarationWithImport,
  findLibraryImportDeclarations,
  usesCompiledAPI,
} from '../../utils/ast';
import { addImportToDeclaration, removeImportFromDeclaration } from '../../utils/ast-to-string';
import { getDeclaredVariables, getSourceCode } from '../../utils/context-compat';
import {
  findJsxImportSourcePragma,
  findJsxPragma,
  getDefaultCompiledImport,
} from '../../utils/jsx';

type Options = {
  detectConflictWithOtherLibraries: boolean;
  onlyRunIfImportingCompiled: boolean;
  runtime: 'classic' | 'automatic';
  importSources: string[];
};

const getOtherLibraryImports = (context: Rule.RuleContext): ImportDeclaration[] => {
  const PROBLEMATIC_IMPORT_SPECIFIERS: readonly string[] = ['css', 'jsx'];

  const PROBLEMATIC_LIBRARIES = ['@emotion/core', '@emotion/react'];
  const otherLibraryImports = findLibraryImportDeclarations(context, PROBLEMATIC_LIBRARIES);

  const detectedLibraries: ImportDeclaration[] = [];

  for (const importDecl of otherLibraryImports) {
    for (const specifier of importDecl.specifiers) {
      if (
        specifier.type === 'ImportSpecifier' &&
        PROBLEMATIC_IMPORT_SPECIFIERS.includes(specifier.imported.name)
      ) {
        const sourceLibrary = importDecl.source.value;
        if (typeof sourceLibrary === 'string' && PROBLEMATIC_LIBRARIES.includes(sourceLibrary)) {
          detectedLibraries.push(importDecl);
        }
      }
    }
  }

  return detectedLibraries;
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
  const compiledImports = findLibraryImportDeclarations(context, options.importSources);
  const defaultCompiledImport = getDefaultCompiledImport(compiledImports);

  return function* fix(fixer: Rule.RuleFixer) {
    const pragma =
      options.runtime === 'classic' ? '@jsx jsx' : `@jsxImportSource ${defaultCompiledImport}`;
    const reactImport = findReactDeclarationWithDefaultImport(source);
    if (reactImport) {
      const [declaration, defaultImport] = reactImport;
      const [defaultImportVariable] = getDeclaredVariables(context, defaultImport);

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

    if (options.runtime === 'classic' && !findDeclarationWithImport(compiledImports, 'jsx')) {
      // jsx import is missing time to add one
      if (compiledImports.length === 0) {
        // No import exists, add a new one!
        yield fixer.insertTextBefore(
          source.ast.body[0],
          `import { jsx } from '${COMPILED_IMPORT}';\n`
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
      description: 'Enforces a jsx pragma when using the `css` prop',
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
      emotionAndCompiledConflict: `You can't have css/styled/jsx be imported from both Emotion and Compiled in the same file - this will cause type-checking and runtime errors. Consider changing all of your Emotion imports from \`@emotion/react\` to \`${COMPILED_IMPORT}\`.`,
    },
    schema: [
      {
        type: 'object',
        properties: {
          runtime: {
            type: 'string',
            pattern: '^(classic|automatic)$',
          },
          detectConflictWithOtherLibraries: {
            type: 'boolean',
          },
          onlyRunIfImportingCompiled: {
            type: 'boolean',
          },
          importSources: {
            type: 'array',
            items: [
              {
                type: 'string',
              },
            ],
          },
        },
        additionalProperties: false,
      },
    ],
    type: 'problem',
  },

  create(context) {
    const optionsRaw = context.options[0] || {};
    const options: Options = {
      detectConflictWithOtherLibraries: optionsRaw.detectConflictWithOtherLibraries ?? true,
      onlyRunIfImportingCompiled:
        optionsRaw.onlyRunIfImportingCompiled ?? !!optionsRaw.importSources?.length,
      runtime: optionsRaw.runtime ?? 'automatic',
      importSources: [...DEFAULT_IMPORT_SOURCES, ...(optionsRaw.importSources ?? [])],
    };

    const source = getSourceCode(context);
    const comments = source.getAllComments();

    const compiledImports = findLibraryImportDeclarations(context, options.importSources);
    const otherLibraryImports = getOtherLibraryImports(context);
    const jsxPragma = findJsxPragma(comments, compiledImports);
    const jsxImportSourcePragma = findJsxImportSourcePragma(comments, options.importSources);
    const defaultCompiledImport = getDefaultCompiledImport(compiledImports);

    return {
      Program() {
        if (jsxPragma && options.runtime === 'automatic') {
          return context.report({
            messageId: 'preferJsxImportSource',
            loc: jsxPragma.loc!,
            *fix(fixer) {
              yield fixer.replaceText(
                jsxPragma as any,
                `/** @jsxImportSource ${defaultCompiledImport} */`
              );

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

              const jsxImport = findDeclarationWithImport(compiledImports, 'jsx');
              if (jsxImport) {
                return;
              }

              if (compiledImports.length) {
                const [firstCompiledImport] = compiledImports;
                const specifiersString = addImportToDeclaration(firstCompiledImport, ['jsx']);

                yield fixer.replaceText(firstCompiledImport, specifiersString);
              } else {
                const jsxImportSourceName = options.importSources.find((name) =>
                  jsxImportSourcePragma.value.includes(`@jsxImportSource ${name}`)
                );

                yield fixer.insertTextBefore(
                  source.ast.body[0],
                  `import { jsx } from '${jsxImportSourceName}';\n`
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

      'JSXAttribute[name.name=/^css$/]': (node: Rule.Node) => {
        if (options.onlyRunIfImportingCompiled && !usesCompiledAPI(compiledImports)) {
          return;
        }

        if (
          options.detectConflictWithOtherLibraries &&
          compiledImports.length &&
          otherLibraryImports.length
        ) {
          context.report({
            node: otherLibraryImports[0],
            messageId: 'emotionAndCompiledConflict',
          });

          return;
        }

        if (node.type !== 'JSXAttribute' || jsxPragma || jsxImportSourcePragma) {
          return;
        }

        context.report({
          node,
          messageId: 'missingPragma',
          data: {
            pragma: options.runtime === 'classic' ? 'jsx' : 'jsxImportSource',
          },
          fix: createFixer(context, source, options),
        });
      },
    };
  },
};
