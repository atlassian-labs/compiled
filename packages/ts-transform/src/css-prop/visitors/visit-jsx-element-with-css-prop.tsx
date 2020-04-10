import * as ts from 'typescript';
import { Declarations, CssVariableExpressions } from '../../types';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';
import { templateLiteralToCss } from '../../utils/template-literal-to-css';
import * as logger from '../../utils/log';
import { getJsxNodeAttributes, createNodeError } from '../../utils/ast-node';
import { createCompiledComponentFromNode } from '../../utils/create-jsx-element';
import { CSS_PROP_NAME } from '../../constants';

export const isJsxElementWithCssProp = (
  node: ts.Node
): node is ts.JsxElement | ts.JsxSelfClosingElement => {
  return !!(
    (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) &&
    getJsxNodeAttributes(node).properties.find(
      prop => ts.isJsxAttribute(prop) && prop.name.text === CSS_PROP_NAME
    )
  );
};

export const visitJsxElementWithCssProp = (
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  variableDeclarations: Declarations,
  context: ts.TransformationContext
) => {
  logger.log('visiting a jsx element with a css prop');

  // Grab the css prop node
  const cssJsxAttribute = getJsxNodeAttributes(node).properties.find(
    prop => ts.isJsxAttribute(prop) && prop.name.escapedText === CSS_PROP_NAME
  ) as ts.JsxAttribute;

  if (!cssJsxAttribute || !cssJsxAttribute.initializer) {
    throw createNodeError(
      'Css prop should have been defined. Check a level higher in the code.',
      node
    );
  }

  let cssToPassThroughCompiler: string = '';
  let cssVariables: CssVariableExpressions[] = [];

  if (ts.isStringLiteral(cssJsxAttribute.initializer)) {
    // static string literal found e.g. css="font-size: 20px;"
    cssToPassThroughCompiler = cssJsxAttribute.initializer.text;
  } else if (!cssJsxAttribute.initializer.expression) {
    // expression was empty e.g. css={}
    // do nothing
  } else if (
    ts.isTemplateExpression(cssJsxAttribute.initializer.expression) ||
    ts.isNoSubstitutionTemplateLiteral(cssJsxAttribute.initializer.expression)
  ) {
    // string literal found with substitutions e.g. css={`color: ${color}`}
    const processed = templateLiteralToCss(
      cssJsxAttribute.initializer.expression,
      variableDeclarations,
      context
    );
    cssVariables = processed.cssVariables;
    cssToPassThroughCompiler = processed.css;
  } else if (ts.isObjectLiteralExpression(cssJsxAttribute.initializer.expression)) {
    // object literal found e.g css={{ fontSize: '20px' }}
    const processed = objectLiteralToCssString(
      cssJsxAttribute.initializer.expression,
      variableDeclarations,
      context
    );
    cssVariables = processed.cssVariables;
    cssToPassThroughCompiler = processed.css;
  } else if (ts.isIdentifier(cssJsxAttribute.initializer.expression)) {
    // We are referencing something directly, like `css={base}`
    const reference = variableDeclarations[cssJsxAttribute.initializer.expression.text];
    if (ts.isVariableDeclaration(reference) && reference.initializer) {
      if (ts.isObjectLiteralExpression(reference.initializer)) {
        const processed = objectLiteralToCssString(
          reference.initializer,
          variableDeclarations,
          context
        );

        cssVariables = processed.cssVariables;
        cssToPassThroughCompiler = processed.css;
      }

      if (ts.isStringLiteralLike(reference.initializer)) {
        const processed = templateLiteralToCss(
          reference.initializer,
          variableDeclarations,
          context
        );

        cssVariables = processed.cssVariables;
        cssToPassThroughCompiler = processed.css;
      }
    }
  } else {
    throw createNodeError(
      "This node can't be transformed. Raise an issue here https://github.com/atlassian-labs/compiled-css-in-js/issues and let's talk about it!",
      cssJsxAttribute.initializer.expression
    );
  }

  return createCompiledComponentFromNode(node, {
    context,
    cssVariables,
    css: cssToPassThroughCompiler,
    propsToRemove: [CSS_PROP_NAME],
  });
};
