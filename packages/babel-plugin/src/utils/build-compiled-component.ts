import generate from '@babel/generator';
import template from '@babel/template';
import * as t from '@babel/types';
import { ax } from '@compiled/react/runtime';
import { unique } from '@compiled/utils';

import type { Metadata } from '../types';

import { buildCssVariables } from './build-css-variables';
import { getJSXAttribute } from './get-jsx-attribute';
import { hoistSheet } from './hoist-sheet';
import { transformCssItems } from './transform-css-items';
import type { CSSOutput } from './types';

/**
 * Will return a generated AST for a Compiled Component.
 * This is primarily used for CSS prop and ClassNames apis.
 *
 * @param node Originating node
 * @param sheets {string[]} Stylesheets
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const compiledTemplate = (node: t.Expression, sheets: string[], meta: Metadata): t.Node => {
  const nonceAttribute = meta.state.opts.nonce ? `nonce={${meta.state.opts.nonce}}` : '';

  const [keyAttribute] = getJSXAttribute(node, 'key');

  return template(
    `
  <CC ${keyAttribute ? generate(keyAttribute).code : ''}>
    <CS ${nonceAttribute}>{%%cssNode%%}</CS>
    {%%jsxNode%%}
  </CC>
  `,
    {
      plugins: ['jsx'],
    }
  )({
    jsxNode: node,
    cssNode: t.arrayExpression(unique(sheets).map((sheet: string) => hoistSheet(sheet, meta))),
  }) as t.Node;
};

/**
 * Returns the actual value of a jsx value.
 *
 * @param node
 */
const getExpression = (
  node: t.JSXElement | t.JSXFragment | t.StringLiteral | t.JSXExpressionContainer
): t.Expression => {
  const value = t.isJSXExpressionContainer(node) ? node.expression : node;

  if (t.isJSXEmptyExpression(value)) {
    throw new Error('Empty expression not supported.');
  }

  return value;
};

/**
 * Check if 'node' is a 'inBuiltComponent'.
 * We assume it's a 'inBuiltComponent' if it starts with a lowercase letter (i.e. div).
 *
 * @param node Originating node
 */
const isInBuiltComponent = (node: t.JSXElement): boolean => {
  let tagName;

  // Get the tag name (i.e. td) from node <td />
  if (
    t.isJSXIdentifier(node.openingElement.name) ||
    t.isJSXNamespacedName(node.openingElement.name)
  ) {
    tagName = node.openingElement.name.name;
  } else {
    tagName = node.openingElement.name.property.name;
  }

  if (typeof tagName !== 'string') return false;

  // Check if the first letter is lower case
  return tagName.charCodeAt(0) >= 97 && tagName.charCodeAt(0) <= 122;
};

/**
 * Check if the `ax` runtime utility is required.
 * We assume it's required if
 * - there is a class name prop statically defined
 * - there is conditional css
 * - 'node' is a 'UserDefinedComponent'
 *
 * @param node Originating node
 * @param classNames The classNames for a component at runtime
 *
 */
const isAxRequired = (node: t.JSXElement, classNames: t.Expression[]) => {
  return (
    isInBuiltComponent(node) &&
    classNames.filter((className) => !t.isStringLiteral(className)).length === 0
  );
};

/**
 * Returns a Compiled Component AST.
 *
 * @param node Originating node
 * @param cssOutput CSS and variables to place onto the component
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const buildCompiledComponent = (
  node: t.JSXElement,
  cssOutput: CSSOutput,
  meta: Metadata
): t.Node => {
  const { sheets, classNames } = transformCssItems(cssOutput.css, meta);

  const [classNameAttribute] = getJSXAttribute(node, 'className');

  if (classNameAttribute && classNameAttribute.value) {
    // If there is a class name prop statically defined we want to concatenate it with
    // the class name we're going to put on it.
    const classNameExpression = getExpression(classNameAttribute.value);
    const values: t.Expression[] = classNames.concat(classNameExpression);

    classNameAttribute.value = t.jsxExpressionContainer(
      t.callExpression(t.identifier('ax'), [t.arrayExpression(values)])
    );
  } else {
    // No class name - just push our own one.
    let classNameNode;

    // We'll remove duplicated atomic declaration group if possible.
    // Otherwise add a runtime utility `ax` to ensure atomic declarations of one single group exist.
    if (isAxRequired(node, classNames)) {
      const str = ax(classNames.map((className) => (className as t.StringLiteral).value));

      if (str) {
        classNameNode = t.stringLiteral(str);
      }
    } else {
      classNameNode = t.jsxExpressionContainer(
        t.callExpression(t.identifier('ax'), [t.arrayExpression(classNames)])
      );
    }

    if (classNameNode) {
      node.openingElement.attributes.push(
        t.jsxAttribute(t.jsxIdentifier('className'), classNameNode)
      );
    }
  }

  if (cssOutput.variables.length) {
    const [styleAttribute, styleAttributeIndex] = getJSXAttribute(node, 'style');

    const dynamicStyleProperties: (t.ObjectProperty | t.SpreadElement)[] = buildCssVariables(
      cssOutput.variables
    );

    if (styleAttribute) {
      // Remove the pre-existing style prop - we're going to redefine it soon.
      node.openingElement.attributes.splice(styleAttributeIndex, 1);

      if (
        styleAttribute.value &&
        t.isJSXExpressionContainer(styleAttribute.value) &&
        !t.isJSXEmptyExpression(styleAttribute.value.expression)
      ) {
        // If it's not an object we just spread the expression into the object
        if (!t.isObjectExpression(styleAttribute.value.expression)) {
          dynamicStyleProperties.splice(0, 0, t.spreadElement(styleAttribute.value.expression));
        } else {
          // Else it's an object! So we want to place each property into the object
          styleAttribute.value.expression.properties.forEach((prop, index) => {
            if (t.isObjectMethod(prop)) {
              return;
            }

            // We want to keep the order that they were defined in.
            // So we're using index here to do just that.
            dynamicStyleProperties.splice(index, 0, prop);
          });
        }
      }
    }

    // Finally add the new style prop back to the opening JSX element.
    node.openingElement.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('style'),
        t.jsxExpressionContainer(t.objectExpression(dynamicStyleProperties))
      )
    );
  }

  return compiledTemplate(node, sheets, meta);
};
