import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';
import { buildStyledComponent, importSpecifier } from './utils/ast-builders';

interface State {
  compiledImportFound: boolean;
}

export default declare<State>((api) => {
  api.assertVersion(7);

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      ImportDeclaration(path, state) {
        if (path.node.source.value === '@compiled/css-in-js') {
          state.compiledImportFound = true;
          path.node.specifiers = path.node.specifiers
            .filter((specifier) => specifier.local.name !== 'styled')
            .concat([importSpecifier('CC'), importSpecifier('CS')]);
        }
      },
      TaggedTemplateExpression(path, state) {
        if (!state.compiledImportFound) {
          return;
        }

        if (
          t.isMemberExpression(path.node.tag) &&
          t.isIdentifier(path.node.tag.object) &&
          path.node.tag.object.name === 'styled'
        ) {
          const tagName = path.node.tag.property.name;
          const css = path.node.quasi.quasis.map((quasi) => quasi.value.cooked).join();

          path.replaceWith(
            buildStyledComponent({
              css,
              tagName,
            })
          );
        }
      },
    },
  };
});
