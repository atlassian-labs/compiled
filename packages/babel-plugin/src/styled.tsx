import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';
import {
  buildStyledComponent,
  buildCompiledComponent,
  importSpecifier,
} from './utils/ast-builders';

interface State {
  compiledImportFound: boolean;
}

const extractFromCssProp = (
  cssProp: t.StringLiteral | t.JSXElement | t.JSXFragment | t.JSXExpressionContainer
) => {
  if (t.isStringLiteral(cssProp)) {
    return cssProp.value;
  }

  return undefined;
};

export default declare<State>((api) => {
  api.assertVersion(7);

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      ImportDeclaration(path, state) {
        if (path.node.source.value === '@compiled/css-in-js') {
          state.compiledImportFound = true;
          path.node.specifiers = path.node.specifiers
            .filter(
              (specifier) =>
                specifier.local.name !== 'styled' && specifier.local.name !== 'ClassNames'
            )
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
      JSXOpeningElement(path, state) {
        if (!state.compiledImportFound) {
          return;
        }

        const cssProp = path.node.attributes.find((attr): attr is t.JSXAttribute => {
          return t.isJSXAttribute(attr) && attr.name.name === 'css';
        });

        if (!cssProp || !cssProp.value) {
          return;
        }

        const extractedCss = extractFromCssProp(cssProp.value);
        if (!extractedCss) {
          throw path.buildCodeFrameError('Css prop value not allowed.');
        }

        path.parentPath.replaceWith(
          buildCompiledComponent({
            css: extractedCss,
          })
        );
      },
    },
  };
});
