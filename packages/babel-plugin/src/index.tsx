import { declare } from '@babel/helper-plugin-utils';
import template from '@babel/template';
import * as t from '@babel/types';
import { importSpecifier } from './utils/ast-builders';
import { visitCssPropPath } from './css-prop';
import { visitStyledPath } from './styled';
import { State } from './types';

export default declare<State>((api) => {
  api.assertVersion(7);

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      Program: {
        exit(path, state) {
          if (state.compiledImports && !path.scope.getBinding('React')) {
            // React is missing - add it in at the last moment!
            path.unshiftContainer('body', template.ast(`import * as React from 'react'`));
          }
        },
      },
      ImportDeclaration(path, state) {
        if (path.node.source.value !== '@compiled/core') {
          return;
        }

        // The presence of the module enables CSS prop
        state.compiledImports = {};

        path.node.specifiers = path.node.specifiers
          .filter((specifier) => {
            if (!state.compiledImports || !t.isImportSpecifier(specifier)) {
              // Bail out early
              return true;
            }

            if (specifier.imported.name === 'styled') {
              state.compiledImports.styled = specifier.local.name;
              // Remove the import
              return false;
            }

            // Keep the import
            return true;
          })
          // Add on the util imports we're going to use later in the transform.
          .concat([importSpecifier('CC'), importSpecifier('CS')]);
      },
      TaggedTemplateExpression(path, state) {
        if (!state.compiledImports?.styled) {
          return;
        }

        visitStyledPath(path, { state, parentPath: path });
      },
      CallExpression(path, state) {
        if (!state.compiledImports) {
          return;
        }

        visitStyledPath(path, { state, parentPath: path });
      },
      JSXOpeningElement(path, state) {
        if (!state.compiledImports) {
          return;
        }

        visitCssPropPath(path, { state, parentPath: path });
      },
    },
  };
});
