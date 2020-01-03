import * as ts from 'typescript';
import { ToCssReturnType, CssVariableExpressions, VariableDeclarations } from '../types';
import { getIdentifierText } from './ast-node';
import { nextCssVariableName } from './identifiers';
import { objectLiteralToCssString } from './object-literal-to-css';
import { extractCssVarFromArrowFunction } from './extract-css-var-from-arrow-function';

export const templateLiteralToCss = (
  node: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral,
  collectedDeclarations: VariableDeclarations,
  context: ts.TransformationContext
): ToCssReturnType => {
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return {
      css: node.text,
      cssVariables: [],
    };
  }

  let cssVariables: CssVariableExpressions[] = [];
  let css = node.head.text;

  node.templateSpans.forEach(span => {
    if (ts.isIdentifier(span.expression)) {
      // We are referencing a variable e.g. css`${var}`;
      const key = getIdentifierText(span.expression);
      const value = collectedDeclarations[key];
      const variableName = `--${key}-${nextCssVariableName()}`;
      if (!value || !value.initializer) {
        throw new Error('variable doesnt exist in scope');
      }

      if (ts.isObjectLiteralExpression(value.initializer)) {
        // We found an object expression e.g. const objVar = {}; css`${objVar}`
        const processed = objectLiteralToCssString(
          value.initializer,
          collectedDeclarations,
          context
        );
        css += processed.css;
        cssVariables = cssVariables.concat(processed.cssVariables);
      } else if (ts.isStringLiteral(value.initializer) || ts.isNumericLiteral(value.initializer)) {
        // We found a literal expression e.g. const stringVar = ''; css`${stringVar}`
        cssVariables.push({
          name: variableName,
          identifier: span.expression as ts.Identifier,
        });

        css += `var(${variableName})${span.literal.text}`;
      }
    } else if (ts.isArrowFunction(span.expression)) {
      // We an an inline arrow function - e.g. css`${props => props.color}`
      const result = extractCssVarFromArrowFunction(span.expression, context);
      cssVariables.push(result);
      css += `var(${result.name})${span.literal.text}`;
    } else {
      throw new Error('unsupported');
    }
  });

  return {
    css,
    cssVariables,
  };
};
