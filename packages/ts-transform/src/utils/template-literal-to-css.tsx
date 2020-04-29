import * as ts from 'typescript';
import { ToCssReturnType, CssVariableExpressions, Declarations } from '../types';
import { getIdentifierText, createNodeError, isConst } from './ast-node';
import { cssVariableHash } from './hash';
import { objectLiteralToCssString } from './object-literal-to-css';
import { extractCssVarFromArrowFunction } from './extract-css-var-from-arrow-function';
import { evaluateFunction, isReturnCssLike } from './evalulate-function';
import { joinToBinaryExpression, joinThreeExpressions } from './expression-operators';
import { cssAfterInterpolation, cssBeforeInterpolation } from './string-interpolations';
import { unique } from './array';
import { removeQuotes } from '../constants';

export const templateLiteralToCss = (
  node: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral | ts.StringLiteral,
  collectedDeclarations: Declarations,
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
    const key = getIdentifierText(span.expression);
    const value = collectedDeclarations[key];

    if (value && ts.isBindingElement(value)) {
      if (ts.isIdentifier(value.name)) {
        cssVariables.push({ name: cssVariableHash(value.name), expression: value.name });
      }
    } else if (ts.isIdentifier(span.expression)) {
      // We are referencing a variable e.g. css`${var}`;

      if (!value) {
        throw createNodeError('declaration does not exist', span);
      }

      if (!ts.isVariableDeclaration(value)) {
        throw createNodeError('only variable declarations supported atm', value);
      }

      if (!value.initializer) {
        throw createNodeError('variable was not initialized', value);
      }

      if (isConst(value)) {
        const declarationValue = value.initializer.getText();
        css += removeQuotes(declarationValue);
      } else {
        const variableName = cssVariableHash(value);

        if (ts.isObjectLiteralExpression(value.initializer)) {
          // We found an object expression e.g. const objVar = {}; css`${objVar}`
          const result = objectLiteralToCssString(
            value.initializer,
            collectedDeclarations,
            context
          );
          css += result.css;
          cssVariables = cssVariables.concat(result.cssVariables);
        } else if (
          ts.isStringLiteral(value.initializer) ||
          ts.isNumericLiteral(value.initializer)
        ) {
          const before = cssBeforeInterpolation(css);
          // We an an inline arrow function - e.g. css`${props => props.color}`
          const after = cssAfterInterpolation(span.literal.text);

          css = before.css;
          let cssVariableExpression: ts.Expression = span.expression;

          if (after.variableSuffix && before.variablePrefix) {
            cssVariableExpression = joinThreeExpressions(
              ts.createStringLiteral(before.variablePrefix),
              span.expression,
              ts.createStringLiteral(after.variableSuffix)
            );
          } else if (after.variableSuffix) {
            cssVariableExpression = joinToBinaryExpression(
              span.expression,
              ts.createStringLiteral(after.variableSuffix)
            );
          } else if (before.variablePrefix) {
            cssVariableExpression = joinToBinaryExpression(
              ts.createStringLiteral(before.variablePrefix),
              span.expression
            );
          }

          cssVariables.push({
            name: variableName,
            expression: cssVariableExpression,
          });
          css += `var(${variableName})${after.css}`;
        } else if (ts.isArrowFunction(value.initializer)) {
          // We found a arrow func expression e.g. const funcVar = () => ({}); css`${funcVar}`
          // We want to "execute" it and then add the result to the css.
          const result = evaluateFunction(value.initializer, collectedDeclarations, context);
          css += result.css;
          cssVariables = cssVariables.concat(result.cssVariables);
        } else if (ts.isCallExpression(value.initializer)) {
          // We found something like this: const val = fun(); css`${val}`;
          // Inline the expression as a css variable - we will need to check if it returns something css like.. but later.
          const variableName = cssVariableHash(span.expression);
          css += `var(${variableName})`;
          cssVariables.push({
            expression: span.expression,
            name: variableName,
          });
        }
      }
    } else if (ts.isArrowFunction(span.expression)) {
      const before = cssBeforeInterpolation(css);
      // We an an inline arrow function - e.g. css`${props => props.color}`
      const after = cssAfterInterpolation(span.literal.text);
      const result = extractCssVarFromArrowFunction(span.expression, context);

      css = before.css;
      let cssVariableExpression: ts.Expression = result.expression;

      if (after.variableSuffix && before.variablePrefix) {
        cssVariableExpression = joinThreeExpressions(
          ts.createStringLiteral(before.variablePrefix),
          result.expression,
          ts.createStringLiteral(after.variableSuffix)
        );
      } else if (after.variableSuffix) {
        cssVariableExpression = joinToBinaryExpression(
          result.expression,
          ts.createStringLiteral(after.variableSuffix)
        );
      } else if (before.variablePrefix) {
        cssVariableExpression = joinToBinaryExpression(
          ts.createStringLiteral(before.variablePrefix),
          result.expression
        );
      }

      cssVariables.push({
        name: result.name,
        expression: cssVariableExpression,
      });
      css += `var(${result.name})${after.css}`;
    } else if (ts.isCallExpression(span.expression)) {
      // We found a call expression - e.g. const funcVar = () => ({}); css`${funcVar()}`
      const key = getIdentifierText(span.expression.expression);
      const value = collectedDeclarations[key];
      if (!value) {
        throw createNodeError('could not find declaration from call expression', span.expression);
      }

      const declarationNode = ts.isVariableDeclaration(value) ? value.initializer : value;
      if (!declarationNode) {
        throw createNodeError('variable was not initialized', value);
      }

      if (isReturnCssLike(declarationNode)) {
        // We want to "evaluate" it and then add the result to the css.
        const result = evaluateFunction(declarationNode, collectedDeclarations, context);
        css += result.css;
        cssVariables = cssVariables.concat(result.cssVariables);
      } else {
        // Ok it doesnt return css just inline the expression as a css variable
        const variableName = cssVariableHash(span.expression);
        css += `var(${variableName})`;
        cssVariables.push({
          expression: span.expression,
          name: variableName,
        });
      }
    } else if (ts.isPropertyAccessExpression(span.expression)) {
      const before = cssBeforeInterpolation(css);
      const after = cssAfterInterpolation(span.literal.text);
      css = before.css;
      let cssVariableExpression: ts.Expression = span.expression;

      if (after.variableSuffix && before.variablePrefix) {
        cssVariableExpression = joinThreeExpressions(
          ts.createStringLiteral(before.variablePrefix),
          span.expression,
          ts.createStringLiteral(after.variableSuffix)
        );
      } else if (after.variableSuffix) {
        cssVariableExpression = joinToBinaryExpression(
          span.expression,
          ts.createStringLiteral(after.variableSuffix)
        );
      } else if (before.variablePrefix) {
        cssVariableExpression = joinToBinaryExpression(
          ts.createStringLiteral(before.variablePrefix),
          span.expression
        );
      }
      const variableName = cssVariableHash(cssVariableExpression);
      cssVariables.push({
        name: variableName,
        expression: cssVariableExpression,
      });
      css += `var(${variableName})${after.css}`;
    } else if (
      ts.isExpressionStatement(span.expression) ||
      ts.isConditionalExpression(span.expression) ||
      ts.isBinaryExpression(span.expression)
    ) {
      // We found something that we'll just inline reference.
      const cssVarName = cssVariableHash(span.expression);
      css += `var(${cssVarName})`;
      cssVariables.push({
        expression: span.expression,
        name: cssVarName,
      });
    } else {
      throw createNodeError('unsupported node', span);
    }
  });

  return {
    css,
    cssVariables: unique(cssVariables, item => item.name),
  };
};
