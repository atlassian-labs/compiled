import * as t from '@babel/types';
import template from '@babel/template';
import { declare } from '@babel/helper-plugin-utils';
import { importSpecifier } from './utils/ast-builders';
import { visitCssPropPath } from './css-prop';
import { visitStyledPath } from './styled';
import { State } from './types';

export default declare<State>((api) => {
  api.assertVersion(7);

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      Program(path, state) {
        const importDeclarations = path.node.body.filter((node) => t.isImportDeclaration(node));
        if (
          importDeclarations.some(
            (declaration: any) => declaration.source.value === '@compiled/core'
          )
        ) {
          state.compiledImportFound = true;

          const isCompiledStyledImportFound = importDeclarations.some(
            (declaration: any) =>
              declaration.source.value === '@compiled/core' &&
              declaration.specifiers.find(
                (specifier: t.ImportSpecifier) => specifier.local.name === 'styled'
              )
          );

          const isReactImportFound = importDeclarations.some(
            (declaration: any) => declaration.source.value === 'react'
          );

          // If we have a Compiled 'styled' import and we don't have a React
          // import, we add a namespaced import to the top of the file.
          if (isCompiledStyledImportFound && !isReactImportFound) {
            path.unshiftContainer('body', template.ast(`import * as React from 'react'`));
            return;
          }
        }
      },
      ImportDeclaration(path, state) {
        if (!state.compiledImportFound) {
          return;
        }
        if (path.node.source.value === '@compiled/core') {
          path.node.specifiers = path.node.specifiers
            .filter(
              (specifier) =>
                specifier.local.name !== 'styled' && specifier.local.name !== 'ClassNames'
            )
            .concat([importSpecifier('CC'), importSpecifier('CS')]);
        }
        // If we find only named React imports but no default, we modify the
        // import declaration to include a default specifier.
        if (
          path.node.source.value === 'react' &&
          !path.node.specifiers.find(
            (specifier) =>
              t.isImportDefaultSpecifier(specifier) || t.isImportNamespaceSpecifier(specifier)
          )
        ) {
          path.unshiftContainer('specifiers', t.importDefaultSpecifier(t.identifier('React')));
        }
      },
      VariableDeclaration(path, state) {
        if (!state.declarations) {
          state.declarations = {};
        }

        if (!t.isIdentifier(path.node.declarations[0].id)) {
          return;
        }

        const declarationName = path.node.declarations[0].id.name;
        state.declarations[declarationName] = path.node;
      },
      TaggedTemplateExpression(path, state) {
        if (!state.compiledImportFound) {
          return;
        }

        visitStyledPath(path, state);
      },
      CallExpression(path, state) {
        if (!state.compiledImportFound) {
          return;
        }

        visitStyledPath(path, state);
      },
      JSXOpeningElement(path, state) {
        if (!state.compiledImportFound) {
          return;
        }

        visitCssPropPath(path, state);
      },
    },
  };
});
