import * as t from '@babel/types';
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
      ImportDeclaration(path, state) {
        if (path.node.source.value === '@compiled/core') {
          state.compiledImportFound = true;
          path.node.specifiers = path.node.specifiers
            .filter(
              (specifier) =>
                specifier.local.name !== 'styled' && specifier.local.name !== 'ClassNames'
            )
            .concat([importSpecifier('CC'), importSpecifier('CS')]);
        }
      },
      // VariableDeclaration(path, state) {
      //   if (!state.declarations) {
      //     state.declarations = {};
      //   }

      //   if (!t.isIdentifier(path.node.declarations[0].id)) {
      //     return;
      //   }

      //   const declarationName = path.node.declarations[0].id.name;
      //   state.declarations[declarationName] = path.node;
      // },
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
