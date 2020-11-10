import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { transformCss } from '@compiled/css';
import { pickFunctionBody } from '../utils/ast';
import { compiledTemplate, buildCssVariablesProp } from '../utils/ast-builders';
import { buildCss, CSSOutput } from '../utils/css-builders';
import { Metadata } from '../types';

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
export const visitClassNamesPath = (path: NodePath<t.JSXElement>, meta: Metadata) => {
  if (
    t.isJSXIdentifier(path.node.openingElement.name) &&
    path.node.openingElement.name.name !== meta.state.compiledImports?.ClassNames
  ) {
    // We aren't interested in this element. Bail out!
    return;
  }

  let variables: CSSOutput['variables'] = [];
  let sheets: string[] = [];

  path.traverse({
    CallExpression(path) {
      const styles = extractStyleObjectExpression(path);
      if (!styles) {
        // Nothing to do - skip.
        return;
      }

      const builtCss = buildCss(styles, meta);
      const transformed = transformCss(builtCss.css);

      variables = variables.concat(builtCss.variables);
      sheets = sheets.concat(transformed.sheets);

      path.replaceWith(t.stringLiteral(transformed.classNames.join(' ')));
    },
  });

  path.traverse({
    Identifier(path) {
      if (path.node.name !== 'style' || path.parentPath.isProperty()) {
        // Nothing to do - skip.
        return;
      }

      const styleValue = variables.length
        ? t.objectExpression(buildCssVariablesProp(variables))
        : t.identifier('undefined');

      path.replaceWith(styleValue);
    },
  });

  const children = path.node.children.find((node) => t.isJSXExpressionContainer(node));

  if (t.isJSXExpressionContainer(children) && t.isArrowFunctionExpression(children.expression)) {
    const body = pickFunctionBody(children.expression);
    path.replaceWith(compiledTemplate(body, sheets, meta));
  }
};
