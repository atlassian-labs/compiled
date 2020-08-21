import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { State } from '../types';
import { buildCss } from '../utils/css-builders';

const extractStyleObjectExpression = (path: NodePath<t.CallExpression>) => {
  if (
    t.isIdentifier(path.node.callee) &&
    path.node.callee.name === 'css' &&
    t.isObjectExpression(path.node.arguments[0])
  ) {
    // css({}) call
    const styles = path.node.arguments[0];
    return styles;
  }

  if (
    t.isMemberExpression(path.node.callee) &&
    t.isIdentifier(path.node.callee.property) &&
    path.node.callee.property.name === 'css' &&
    t.isObjectExpression(path.node.arguments[0])
  ) {
    // props.css({}) call
    const styles = path.node.arguments[0];
    return styles;
  }

  return undefined;
};

/**
 * Takes a class name component and transforms it into a compiled component.
 * This method will traverse the AST twice,
 * once to replace all calls to `css`,
 * and another to replace `style` usage.
 *
 * `<ClassNames>{}</ClassNames>`
 *
 * @param path Babel path - expects to be a JSX opening element.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
export const visitClassNamesPath = (path: NodePath<t.JSXElement>, state: State) => {
  if (
    t.isJSXIdentifier(path.node.openingElement.name) &&
    path.node.openingElement.name.name !== 'ClassNames'
  ) {
    // We aren't interested in this element. Bail out!
    return;
  }

  path.traverse({
    CallExpression(path) {
      const styles = extractStyleObjectExpression(path);
      if (!styles) {
        // Nothing to do - bail out!
        return;
      }

      const css = buildCss(styles, state);
      console.log(css.css);
      path.replaceWith(t.stringLiteral('hello'));
    },
  });
};
