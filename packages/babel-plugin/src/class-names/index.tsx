import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { transformCss } from '@compiled/css';
import { pickFunctionBody, buildCodeFrameError } from '../utils/ast';
import { compiledTemplate, buildCssVariablesProp } from '../utils/ast-builders';
import { buildCss, CSSOutput } from '../utils/css-builders';
import { Metadata } from '../types';

/**
 * Extracts styles from an expression.
 *
 * @param path Expression node
 */
const extractStyles = (path: NodePath<t.Expression>) => {
  if (
    t.isCallExpression(path.node) &&
    t.isIdentifier(path.node.callee) &&
    path.node.callee.name === 'css' &&
    t.isExpression(path.node.arguments[0])
  ) {
    // css({}) call
    const styles = path.node.arguments[0];
    return styles;
  }

  if (
    t.isCallExpression(path.node) &&
    t.isMemberExpression(path.node.callee) &&
    t.isIdentifier(path.node.callee.property) &&
    path.node.callee.property.name === 'css' &&
    t.isExpression(path.node.arguments[0])
  ) {
    // props.css({}) call
    const styles = path.node.arguments[0];
    return styles;
  }

  if (t.isTaggedTemplateExpression(path.node)) {
    const styles = path.node.quasi;
    return styles;
  }

  return undefined;
};

/**
 * Returns the children of a children as function expression.
 * Will throw if no children as function was found.
 *
 * @param path
 */
const getJsxChildrenAsFunction = (path: NodePath<t.JSXElement>) => {
  const children = path.node.children.find((node) => t.isJSXExpressionContainer(node));
  if (t.isJSXExpressionContainer(children) && t.isFunction(children.expression)) {
    return children.expression;
  }

  throw buildCodeFrameError(
    `ClassNames children should be a function
E.g: <ClassNames>{props => <div />}</ClassNames>`,
    path.node,
    path
  );
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

  const variables: CSSOutput['variables'] = [];
  const sheets: string[] = [];

  // First pass to replace all usages of `css({})`
  path.traverse({
    Expression(path) {
      const styles = extractStyles(path);
      if (!styles) {
        // Nothing to do - skip.
        return;
      }

      const builtCss = buildCss(styles, meta);
      const transformed = transformCss(builtCss.css.map((x) => x.css).join(''));

      variables.push(...builtCss.variables);
      sheets.push(...transformed.sheets);

      path.replaceWith(t.stringLiteral(transformed.classNames.join(' ')));
    },
  });

  // Second pass to replace all usages of `style`.
  path.traverse({
    Identifier(path) {
      if (
        path.node.name !== 'style' ||
        path.parentPath.isProperty() ||
        !path.scope.hasOwnBinding('style')
      ) {
        // Nothing to do - skip.
        return;
      }

      const styleValue = variables.length
        ? t.objectExpression(buildCssVariablesProp(variables))
        : t.identifier('undefined');

      path.replaceWith(styleValue);
    },
  });

  // All done! Pick the children as function body and replace the original ClassNames node with it.
  const children = getJsxChildrenAsFunction(path);
  const body = pickFunctionBody(children);
  path.replaceWith(compiledTemplate(body, sheets, meta));
};
