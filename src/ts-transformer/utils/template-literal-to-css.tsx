import * as ts from 'typescript';
import { ToCssReturnType, CssVariableExpressions, VariableDeclarations } from '../types';
import { getIdentifierText } from './ast-node';
import { nextCssVariableName } from './identifiers';
import { objectLiteralToCssString } from './object-literal-to-css';

export const templateLiteralToCss = (
  node: ts.TemplateExpression,
  collectedDeclarations: VariableDeclarations,
  context: ts.TransformationContext
): ToCssReturnType => {
  let cssVariables: CssVariableExpressions[] = [];
  let css = node.head.text;

  node.templateSpans.forEach(span => {
    const key = getIdentifierText(span.expression);
    const variableName = `--${key}-${nextCssVariableName()}`;
    const value = collectedDeclarations[key];
    if (!value || !value.initializer) {
      throw new Error('variable doesnt exist in scope');
    }

    if (ts.isObjectLiteralExpression(value.initializer)) {
      const processed = objectLiteralToCssString(value.initializer, collectedDeclarations, context);
      css += processed.css;
      cssVariables = cssVariables.concat(processed.cssVariables);
    } else if (ts.isStringLiteral(value.initializer)) {
      const cssVariableReference = `var(${variableName})`;
      cssVariables.push({
        name: variableName,
        identifier: span.expression as ts.Identifier,
      });

      css += `${cssVariableReference}${span.literal.text}`;
    } else {
      throw new Error('unsupported');
    }
  });

  return {
    css,
    cssVariables,
  };
};
