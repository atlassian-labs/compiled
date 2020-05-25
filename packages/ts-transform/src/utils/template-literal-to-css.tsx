import * as ts from 'typescript';
import { ToCssReturnType, CssVariableExpressions, Declarations } from '../types';
import { getIdentifierText, createNodeError, isConst } from './ast-node';
import { cssVariableHash } from './hash';
import { objectLiteralToCssString } from './object-literal-to-css';
import { extractCssVarFromArrowFunction } from './extract-css-var-from-arrow-function';
import { evaluateFunction, isReturnCssLike } from './evalulate-function';
import { joinToBinaryExpression, joinThreeExpressions } from './expression-operators';
import {
  cssAfterInterpolation,
  cssBeforeInterpolation,
  inline,
  AfterInterpolation,
  BeforeInterpolation,
} from './string-interpolations';
import { unique } from './array';

const buildCssVariableExression = (
  initialExpression: ts.Expression,
  before: BeforeInterpolation,
  after: AfterInterpolation
) => {
  let cssVariableExpression: ts.Expression = initialExpression;

  if (after.variableSuffix && before.variablePrefix) {
    cssVariableExpression = joinThreeExpressions(
      ts.createStringLiteral(before.variablePrefix),
      initialExpression,
      ts.createStringLiteral(after.variableSuffix)
    );
  } else if (after.variableSuffix) {
    cssVariableExpression = joinToBinaryExpression(
      initialExpression,
      ts.createStringLiteral(after.variableSuffix)
    );
  } else if (before.variablePrefix) {
    cssVariableExpression = joinToBinaryExpression(
      ts.createStringLiteral(before.variablePrefix),
      initialExpression
    );
  }

  return cssVariableExpression;
};

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

  node.templateSpans.forEach((span) => {
    const key = getIdentifierText(span.expression);
    const value = collectedDeclarations[key];

    if (value && ts.isBindingElement(value)) {
      if (ts.isIdentifier(value.name)) {
        const variableName = cssVariableHash(value.name);
        const before = cssBeforeInterpolation(css);
        const after = cssAfterInterpolation(span.literal.text);
        const { variablePrefix } = before;
        const { variableSuffix } = after;

        css = before.css;
        let cssVariableExpression: ts.Expression = span.expression;
        if (variableSuffix && variablePrefix) {
          cssVariableExpression = joinThreeExpressions(
            ts.createStringLiteral(variablePrefix),
            span.expression,
            ts.createStringLiteral(variableSuffix)
          );
        } else if (variableSuffix) {
          cssVariableExpression = joinToBinaryExpression(
            span.expression,
            ts.createStringLiteral(variableSuffix)
          );
        } else if (variablePrefix) {
          cssVariableExpression = joinToBinaryExpression(
            ts.createStringLiteral(variablePrefix),
            span.expression
          );
        }

        cssVariables.push({
          name: variableName,
          expression: cssVariableExpression,
        });
        css += `var(${variableName})${after.css}`;
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

      const variableName = cssVariableHash(value);

      if (ts.isObjectLiteralExpression(value.initializer)) {
        // We found an object expression e.g. const objVar = {}; css`${objVar}`
        const result = objectLiteralToCssString(value.initializer, collectedDeclarations, context);
        css += `${result.css}${span.literal.text.replace(/^;/, '')}`;
        cssVariables = cssVariables.concat(result.cssVariables);
      } else if (ts.isStringLiteral(value.initializer) || ts.isNumericLiteral(value.initializer)) {
        // We an an inline arrow function - e.g. css`${props => props.color}`
        const before = cssBeforeInterpolation(css);
        const after = cssAfterInterpolation(span.literal.text);
        const { variablePrefix } = before;
        const { variableSuffix } = after;

        css = before.css;
        let cssVariableExpression: ts.Expression = span.expression;

        if (isConst(value)) {
          css += inline(variablePrefix) + value.initializer.text + inline(variableSuffix);
        } else {
          cssVariableExpression = buildCssVariableExression(cssVariableExpression, before, after);

          cssVariables.push({
            name: variableName,
            expression: cssVariableExpression,
          });
          css += `var(${variableName})${after.css}`;
        }
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
    } else if (ts.isArrowFunction(span.expression)) {
      const before = cssBeforeInterpolation(css);
      // We an an inline arrow function - e.g. css`${props => props.color}`
      const after = cssAfterInterpolation(span.literal.text);
      const result = extractCssVarFromArrowFunction(span.expression, context);
      const cssVariableExpression = buildCssVariableExression(result.expression, before, after);

      cssVariables.push({
        name: result.name,
        expression: cssVariableExpression,
      });
      css = before.css;
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
      const cssVariableExpression = buildCssVariableExression(span.expression, before, after);
      const variableName = cssVariableHash(cssVariableExpression);

      cssVariables.push({
        name: variableName,
        expression: cssVariableExpression,
      });

      css = before.css;
      css += `var(${variableName})${after.css}`;
    } else if (
      ts.isExpressionStatement(span.expression) ||
      ts.isConditionalExpression(span.expression) ||
      ts.isBinaryExpression(span.expression)
    ) {
      // We found something that we'll just inline reference.
      const before = cssBeforeInterpolation(css);
      const after = cssAfterInterpolation(span.literal.text);
      const cssVariableExpression = buildCssVariableExression(span.expression, before, after);
      const cssVarName = cssVariableHash(cssVariableExpression);

      css += `var(${cssVarName})${after.css}`;
      cssVariables.push({
        expression: cssVariableExpression,
        name: cssVarName,
      });
    } else {
      throw createNodeError('unsupported node', span);
    }
  });

  return {
    css,
    cssVariables: unique(cssVariables, (item) => item.name),
  };
};
