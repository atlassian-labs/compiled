import * as ts from 'typescript';
import { ToCssReturnType, CssVariableExpressions, VariableDeclarations } from '../types';
import { getIdentifierText } from './ast-node';
import { nextCssVariableName } from './identifiers';
import { objectLiteralToCssString } from './object-literal-to-css';
import { extractCssVarFromArrowFunction } from './extract-css-var-from-arrow-function';
import { evaluateFunction } from './evalulate-function';
import { joinToBinaryExpression } from './expression-operators';

/**
 * Extracts a suffix from a css property e.g:
 * 'px;font-size: 20px; would return "px" as the suffix and ";font-size: 20px;" as rest.
 */
const extractSuffix = (tail: string) => {
  let suffix = '';
  let rest = '';

  if (tail[0] === '\n' || tail[0] === ';') {
    rest = tail;
  } else {
    // Sometimes people forget to put a comma at the end.
    // This handles that case.
    const tailIndex = tail.indexOf(';') === -1 ? tail.indexOf('\n') : tail.indexOf(';');
    suffix = tail.slice(0, tailIndex);
    rest = tail.slice(tailIndex);
  }

  return {
    suffix,
    rest,
  };
};

export const templateLiteralToCss = (
  node: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral | ts.StringLiteral,
  collectedDeclarations: VariableDeclarations,
  context: ts.TransformationContext
): ToCssReturnType => {
  if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) {
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
        const result = objectLiteralToCssString(value.initializer, collectedDeclarations, context);
        css += result.css;
        cssVariables = cssVariables.concat(result.cssVariables);
      } else if (ts.isStringLiteral(value.initializer) || ts.isNumericLiteral(value.initializer)) {
        // We found a literal expression e.g. const stringVar = ''; css`${stringVar}`
        const result = extractSuffix(span.literal.text);
        cssVariables.push({
          name: variableName,
          identifier: result.suffix
            ? // Join left + right if suffix is defined
              joinToBinaryExpression(span.expression, ts.createStringLiteral(result.suffix))
            : // Else just return the expression we found
              span.expression,
        });
        css += `var(${variableName})${result.rest}`;
      } else if (ts.isArrowFunction(value.initializer)) {
        // We found a arrow func expression e.g. const funcVar = () => ({}); css`${funcVar}`
        // We want to "execute" it and then add the result to the css.
        const result = evaluateFunction(value.initializer, collectedDeclarations, context);
        css += result.css;
        cssVariables = cssVariables.concat(result.cssVariables);
      }
    } else if (ts.isArrowFunction(span.expression)) {
      // We an an inline arrow function - e.g. css`${props => props.color}`
      const result = extractCssVarFromArrowFunction(span.expression, context);
      cssVariables.push(result);
      css += `var(${result.name})${span.literal.text}`;
    } else if (ts.isCallExpression(span.expression)) {
      // We found a call expression - e.g. const funcVar = () => ({}); css`${funcVar()}`
      const key = getIdentifierText(span.expression.expression);
      const value = collectedDeclarations[key];
      if (!value || !value.initializer) {
        throw new Error('could not find');
      }
      // We want to "execute" it and then add the result to the css.
      const result = evaluateFunction(value.initializer, collectedDeclarations, context);
      css += result.css;
      cssVariables = cssVariables.concat(result.cssVariables);
    } else {
      throw new Error('unsupported');
    }
  });

  return {
    css,
    cssVariables,
  };
};
