import * as ts from 'typescript';
import { ToCssReturnType, CssVariableExpressions, Declarations } from '../types';
import { getIdentifierText, createNodeError } from './ast-node';
import { cssVariableHash } from './hash';
import { objectLiteralToCssString } from './object-literal-to-css';
import { extractCssVarFromArrowFunction } from './extract-css-var-from-arrow-function';
import { evaluateFunction, isReturnCssLike } from './evalulate-function';
import { joinToBinaryExpression, joinThreeExpressions } from './expression-operators';

/**
 * Extracts a suffix from a css property e.g:
 * 'px;font-size: 20px; would return "px" as the suffix and ";font-size: 20px;" as rest.
 */
export const cssAfterInterpolation = (tail: string): { css: string; variableSuffix?: string } => {
  let variableSuffix = '';
  let css = '';

  if (tail[0] === '\n' || tail[0] === ';' || tail[0] === ',') {
    css = tail;
  } else {
    // Sometimes people forget to put a semi-colon at the end.
    let tailIndex;
    // when calc property used, we get ')' along with unit in the 'literal' object
    // Eg. `marginLeft: calc(100% - ${obj.key}rem)` will give ')rem' in the span literal
    if (tail.indexOf(')') !== -1) {
      tailIndex = tail.indexOf(')');
    } else if (tail.indexOf(';') !== -1) {
      tailIndex = tail.indexOf(';');
    } else if (tail.indexOf(',') !== -1) {
      tailIndex = tail.indexOf(',');
    } else if (tail.indexOf('\n') !== -1) {
      tailIndex = tail.indexOf('\n');
    } else {
      tailIndex = tail.length;
    }

    variableSuffix = tail.slice(0, tailIndex);
    css = tail.slice(tailIndex);
  }

  return {
    variableSuffix,
    css,
  };
};

export const cssBeforeInterpolation = (css: string): { css: string; variablePrefix?: string } => {
  const trimCss = css.trim();
  if (
    trimCss[trimCss.length - 1] === '(' ||
    trimCss[0] === ',' ||
    trimCss[trimCss.length - 1] === ','
  ) {
    // We are inside a css like "translateX(".
    // There is no prefix we need to extract here.
    return {
      css: css,
      variablePrefix: undefined,
    };
  }

  if (!css.match(/:|;/) && !css.includes('(')) {
    return {
      variablePrefix: css,
      css: '',
    };
  }

  let variablePrefix = css.match(/:(.+$)/)?.[1];
  if (variablePrefix) {
    variablePrefix = variablePrefix.trim();
    const lastIndex = css.lastIndexOf(variablePrefix);
    css = css.slice(0, lastIndex);
  }

  return {
    css,
    variablePrefix,
  };
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

  node.templateSpans.forEach(span => {
    if (ts.isIdentifier(span.expression)) {
      // We are referencing a variable e.g. css`${var}`;
      const key = getIdentifierText(span.expression);
      const value = collectedDeclarations[key];
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
        css += result.css;
        cssVariables = cssVariables.concat(result.cssVariables);
      } else if (ts.isStringLiteral(value.initializer) || ts.isNumericLiteral(value.initializer)) {
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
    cssVariables,
  };
};
