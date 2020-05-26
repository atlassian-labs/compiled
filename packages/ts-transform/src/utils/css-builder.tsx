import ts from 'typescript';
import { Declarations, CssVariableExpressions, ToCssReturnType } from '../types';
import { templateLiteralToCss } from './template-literal-to-css';
import { createNodeError } from './ast-node';
import { objectLiteralToCssString } from './object-literal-to-css';

/**
 * This function takes an expression node and then returns the static representation of it
 * as a CSS string and CSS variable declarations.
 */
export const buildCss = (
  node: ts.Expression,
  variableDeclarations: Declarations,
  context: ts.TransformationContext
): ToCssReturnType => {
  let cssToPassThroughCompiler = '';
  let cssVariables: CssVariableExpressions[] = [];

  if (ts.isStringLiteral(node)) {
    // static string literal found e.g. css="font-size: 20px;"
    cssToPassThroughCompiler = node.text;
  } else if (!node) {
    // expression was empty e.g. css={}
    // do nothing
  } else if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    // string literal found with substitutions e.g. css={`color: ${color}`}
    const processed = templateLiteralToCss(node, variableDeclarations, context);
    cssVariables = processed.cssVariables;
    cssToPassThroughCompiler = processed.css;
  } else if (ts.isObjectLiteralExpression(node)) {
    // object literal found e.g css={{ fontSize: '20px' }}
    const processed = objectLiteralToCssString(node, variableDeclarations, context);
    cssVariables = processed.cssVariables;
    cssToPassThroughCompiler = processed.css;
  } else if (ts.isIdentifier(node)) {
    // We are referencing something directly, like `css={base}`
    const reference = variableDeclarations[node.text];
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
  } else if (ts.isArrayLiteralExpression(node)) {
    const arrayLiteral = node;
    arrayLiteral.elements.forEach((element) => {
      let actual: ts.Expression = element;

      if (ts.isIdentifier(element)) {
        const declaration = variableDeclarations[element.text];
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          actual = declaration.initializer;
        }
      }

      if (ts.isObjectLiteralExpression(actual)) {
        const processed = objectLiteralToCssString(actual, variableDeclarations, context);
        cssVariables = cssVariables.concat(processed.cssVariables);
        cssToPassThroughCompiler += processed.css;
      } else if (ts.isStringLiteralLike(actual)) {
        const processed = templateLiteralToCss(actual, variableDeclarations, context);
        cssVariables = cssVariables.concat(processed.cssVariables);
        cssToPassThroughCompiler += processed.css;
      } else if (ts.isArrowFunction(actual)) {
      } else {
        throw createNodeError('Element not supported', element);
      }
    });
  } else {
    throw createNodeError(
      "This node can't be transformed. Raise an issue here https://github.com/atlassian-labs/compiled-css-in-js/issues and let's talk about it!",
      node
    );
  }

  return {
    cssVariables,
    css: cssToPassThroughCompiler,
  };
};
