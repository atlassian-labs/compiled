import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { transformCss } from '@compiled/css';
import {
  pickFunctionBody,
  buildCodeFrameError,
  resolveIdentifierComingFromDestructuring,
} from '../utils/ast';
import { compiledTemplate, buildCssVariablesProp } from '../utils/ast-builders';
import { buildCss, getItemCss } from '../utils/css-builders';
import { Metadata } from '../types';
import { CSSOutput } from '../utils/types';

/**
 * Handles style prop value. If variables are present it will replace its value with it
 * otherwise will add undefined.
 *
 * @param variables CSS variables prop to be placed as inline styles
 * @param path Any Expression path
 */
const handleStyleProp = (variables: CSSOutput['variables'], path: NodePath<t.Expression>) => {
  const styleValue = variables.length
    ? t.objectExpression(buildCssVariablesProp(variables))
    : t.identifier('undefined');

  path.replaceWith(styleValue);
};

/**
 * Extracts styles from an expression.
 *
 * @param path Expression node
 */
const extractStyles = (path: NodePath<t.Expression>): t.Expression[] | t.Expression | undefined => {
  if (
    t.isCallExpression(path.node) &&
    t.isIdentifier(path.node.callee) &&
    path.node.callee.name === 'css' &&
    t.isExpression(path.node.arguments[0])
  ) {
    // css({}) call
    const styles = path.node.arguments as t.Expression[];
    return styles;
  }

  if (
    t.isCallExpression(path.node) &&
    t.isIdentifier(path.node.callee) &&
    t.isExpression(path.node.arguments[0]) &&
    path.scope.hasOwnBinding(path.node.callee.name)
  ) {
    const binding = path.scope.getBinding(path.node.callee.name)?.path.node;

    if (
      !!resolveIdentifierComingFromDestructuring({ name: 'css', node: binding as t.Expression })
    ) {
      // c({}) rename call
      const styles = path.node.arguments as t.Expression[];
      return styles;
    }
  }

  if (t.isCallExpression(path.node) && t.isMemberExpression(path.node.callee)) {
    if (
      t.isIdentifier(path.node.callee.property) &&
      path.node.callee.property.name === 'css' &&
      t.isExpression(path.node.arguments[0])
    ) {
      // props.css({}) call
      const styles = path.node.arguments as t.Expression[];
      return styles;
    }
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

  const collectedVariables: CSSOutput['variables'] = [];
  const collectedSheets: string[] = [];

  // First pass to replace all usages of `css({})`
  path.traverse({
    Expression(path) {
      const styles = extractStyles(path);
      if (!styles) {
        // Nothing to do - skip.
        return;
      }

      const builtCss = buildCss(styles, meta);
      const { sheets, classNames } = transformCss(builtCss.css.map((x) => getItemCss(x)).join(''));

      collectedVariables.push(...builtCss.variables);
      collectedSheets.push(...sheets);

      path.replaceWith(t.stringLiteral(classNames.join(' ')));
    },
  });

  // Second pass to replace all usages of `style`.
  path.traverse({
    Expression(path) {
      if (t.isIdentifier(path.node)) {
        if (path.parentPath.isProperty()) {
          return;
        }

        // style={style}
        if (path.node.name === 'style' && path.scope.hasOwnBinding('style')) {
          handleStyleProp(collectedVariables, path);
        }

        // style={styl} rename prop
        if (path.scope.hasOwnBinding(path.node.name)) {
          const binding = path.scope.getBinding(path.node.name)?.path.node;

          if (
            !!resolveIdentifierComingFromDestructuring({
              name: 'style',
              node: binding as t.Expression,
            })
          ) {
            handleStyleProp(collectedVariables, path);
          }
        }
      } else if (t.isMemberExpression(path.node)) {
        // filter out invalid calls like dontexist.style
        if (t.isIdentifier(path.node.object) && !path.scope.hasOwnBinding(path.node.object.name)) {
          return;
        }

        // style={props.style}
        if (t.isIdentifier(path.node.property) && path.node.property.name === 'style') {
          handleStyleProp(collectedVariables, path);
        }
      }
    },
  });

  // All done! Pick the children as function body and replace the original ClassNames node with it.
  const children = getJsxChildrenAsFunction(path);
  const body = pickFunctionBody(children);
  path.replaceWith(compiledTemplate(body, collectedSheets, meta));
};
