import * as ts from 'typescript';
import { ToCssReturnType, CssVariableExpressions, VariableDeclarations } from '../types';
import { getIdentifierText } from './ast-node';
import { nextCssVariableName } from './identifiers';
import { objectLiteralToCssString } from './object-literal-to-css';

export const templateLiteralToCss = (
  node: ts.TemplateExpression,
  scopedVariables: VariableDeclarations,
  context: ts.TransformationContext
): ToCssReturnType => {
  let cssVariables: CssVariableExpressions[] = [];
  let css = '';

  css = node.head.text;
  node.templateSpans.forEach(span => {
    const key = getIdentifierText(span.expression);
    const variableName = `--${key}-${nextCssVariableName()}`;
    const value = scopedVariables[key];

    if (!value || !value.initializer) {
      throw new Error('variable doesnt exist in scope');
    }

    if (ts.isObjectLiteralExpression(value.initializer)) {
      const processed = objectLiteralToCssString(value.initializer, scopedVariables, context);
      css = processed.css;
      cssVariables = cssVariables.concat(processed.cssVariables);
    } else if (!ts.isStringLiteral(value.initializer)) {
      throw new Error('only string literals supported atm');
    } else {
      const cssVariableReference = `var(${variableName})`;
      cssVariables.push({
        name: variableName,
        identifier: span.expression as ts.Identifier,
      });

      css += `${cssVariableReference}${span.literal.text}`;
    }
  });

  return {
    css,
    cssVariables,
  };
};
