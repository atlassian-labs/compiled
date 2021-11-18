import generate from '@babel/generator';
import template from '@babel/template';
import * as t from '@babel/types';
import { unique } from '@compiled/utils';

import type { Metadata } from '../types';

import { buildCssVariables } from './build-css-variables';
import { getJSXAttribute } from './get-jsx-attribute';
import { hoistSheet } from './hoist-sheet';
import { transformCssItems } from './transform-css-items';
import type { CSSOutput } from './types';

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

const transformClassNameProp = (element: t.JSXElement, classNames: t.Expression[]) => {
  const [classNameAttribute] = getJSXAttribute(element, 'className');

  if (classNameAttribute && classNameAttribute.value) {
    // If there is a class name prop statically defined we want to concatenate it with
    // the class name we're going to put on it.
    const classNameExpression = getExpression(classNameAttribute.value);
    const values: t.Expression[] = classNames.concat(classNameExpression);

    classNameAttribute.value = t.jsxExpressionContainer(
      t.callExpression(t.identifier('ax'), [t.arrayExpression(values)])
    );
  } else {
    // No className prop - just push our own one.
    element.openingElement.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('className'),
        t.jsxExpressionContainer(
          t.callExpression(t.identifier('ax'), [t.arrayExpression(classNames)])
        )
      )
    );
  }
};

const transformStyleProp = (element: t.JSXElement, variables: CSSOutput['variables']): void => {
  if (!variables.length) {
    return;
  }

  const [styleAttribute, styleAttributeIndex] = getJSXAttribute(element, 'style');

  const dynamicStyleProperties: (t.ObjectProperty | t.SpreadElement)[] =
    buildCssVariables(variables);

  if (styleAttribute) {
    // Remove the pre-existing style prop - we're going to redefine it soon.
    element.openingElement.attributes.splice(styleAttributeIndex, 1);

    if (
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
  element.openingElement.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier('style'),
      t.jsxExpressionContainer(t.objectExpression(dynamicStyleProperties))
    )
  );
};

/**
 * Will return a generated AST for a Compiled Component.
 * This is primarily used for CSS prop and ClassNames apis.
 *
 * @param node Originating node
 * @param sheets {string[]} Stylesheets
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const compiledTemplate = (node: t.Expression, sheets: Sheet[], meta: Metadata): t.Node => {
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
    cssNode: t.arrayExpression(
      unique(sheets).map((sheet) =>
        sheet.type === 'reference' ? t.identifier(sheet.reference) : hoistSheet(sheet, meta)
      )
    ),
  }) as t.Node;
};

/**
 * Returns a Compiled Component AST.
 *
 * @param element Originating JSX element
 * @param cssOutput CSS and variables to place onto the component
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const buildCompiledComponent = (
  element: t.JSXElement,
  cssOutput: CSSOutput,
  meta: Metadata
): t.Node => {
  const { css, variables } = cssOutput;
  const { sheets, classNames } = transformCssItems(css);

  transformClassNameProp(element, classNames);
  transformStyleProp(element, variables);

  return compiledTemplate(element, sheets, meta);
};
