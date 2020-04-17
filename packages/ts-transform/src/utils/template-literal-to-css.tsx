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
const extractSuffix = (tail: string) => {
  let suffix = '';
  let rest = '';

  if (tail[0] === '\n' || tail[0] === ';') {
    rest = tail;
  } else {
    // Sometimes people forget to put a semi-colon at the end.
    let tailIndex;
    // when calc property used, we get ')' along with unit in the 'literal' object
    // Eg. `marginLeft: calc(100% - ${obj.key}rem)` will give ')rem' in the span literal
    if (tail.indexOf(')') !== -1) {
      tailIndex = tail.indexOf(')');
    } else if (tail.indexOf(';') !== -1) {
      tailIndex = tail.indexOf(';');
    } else if (tail.indexOf('\n') !== -1) {
      tailIndex = tail.indexOf('\n');
    } else {
      tailIndex = tail.length;
    }

    if (tailIndex === -1) {
      // Ok still nothing. This means everything is a suffix!
      tailIndex = tail.length;
    }

    suffix = tail.slice(0, tailIndex);
    rest = tail.slice(tailIndex);
    if (!rest) {
      rest = ';';
    }
  }

  return {
    suffix,
    rest,
  };
};

const extractPrefix = (css: string): { css: string; prefix?: string } => {
  let prefix = css.match(/:(.+$)/)?.[1];
  if (prefix) {
    prefix = prefix.trim();
    const lastIndex = css.lastIndexOf(prefix);
    css = css.slice(0, lastIndex);
  }

  return {
    css,
    prefix,
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
        const extractedPrefix = extractPrefix(css);
        // We an an inline arrow function - e.g. css`${props => props.color}`
        const extractedSuffix = extractSuffix(span.literal.text);
        const result = extractSuffix(span.literal.text);

        css = extractedPrefix.css;
        let cssVariableExpression: ts.Expression = span.expression;

        if (extractedSuffix.suffix && extractedPrefix.prefix) {
          cssVariableExpression = joinThreeExpressions(
            ts.createStringLiteral(extractedPrefix.prefix),
            span.expression,
            ts.createStringLiteral(extractedSuffix.suffix)
          );
        } else if (extractedSuffix.suffix) {
          cssVariableExpression = joinToBinaryExpression(
            span.expression,
            ts.createStringLiteral(extractedSuffix.suffix)
          );
        } else if (extractedPrefix.prefix) {
          cssVariableExpression = joinToBinaryExpression(
            ts.createStringLiteral(extractedPrefix.prefix),
            span.expression
          );
        }

        cssVariables.push({
          name: variableName,
          expression: cssVariableExpression,
        });
        css += `var(${variableName})${result.rest}`;
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
      const extractedPrefix = extractPrefix(css);
      // We an an inline arrow function - e.g. css`${props => props.color}`
      const extractedSuffix = extractSuffix(span.literal.text);
      const result = extractCssVarFromArrowFunction(span.expression, context);

      css = extractedPrefix.css;
      let cssVariableExpression: ts.Expression = result.expression;

      if (extractedSuffix.suffix && extractedPrefix.prefix) {
        cssVariableExpression = joinThreeExpressions(
          ts.createStringLiteral(extractedPrefix.prefix),
          result.expression,
          ts.createStringLiteral(extractedSuffix.suffix)
        );
      } else if (extractedSuffix.suffix) {
        cssVariableExpression = joinToBinaryExpression(
          result.expression,
          ts.createStringLiteral(extractedSuffix.suffix)
        );
      } else if (extractedPrefix.prefix) {
        cssVariableExpression = joinToBinaryExpression(
          ts.createStringLiteral(extractedPrefix.prefix),
          result.expression
        );
      }

      cssVariables.push({
        name: result.name,
        expression: cssVariableExpression,
      });
      css += `var(${result.name})${extractedSuffix.rest}`;
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
      const extractedPrefix = extractPrefix(css);
      const extractedSuffix = extractSuffix(span.literal.text);
      const result = extractSuffix(span.literal.text);
      css = extractedPrefix.css;
      let cssVariableExpression: ts.Expression = span.expression;

      if (extractedSuffix.suffix && extractedPrefix.prefix) {
        cssVariableExpression = joinThreeExpressions(
          ts.createStringLiteral(extractedPrefix.prefix),
          span.expression,
          ts.createStringLiteral(extractedSuffix.suffix)
        );
      } else if (extractedSuffix.suffix) {
        cssVariableExpression = joinToBinaryExpression(
          span.expression,
          ts.createStringLiteral(extractedSuffix.suffix)
        );
      } else if (extractedPrefix.prefix) {
        cssVariableExpression = joinToBinaryExpression(
          ts.createStringLiteral(extractedPrefix.prefix),
          span.expression
        );
      }
      const variableName = cssVariableHash(cssVariableExpression);
      cssVariables.push({
        name: variableName,
        expression: cssVariableExpression,
      });
      css += `var(${variableName})${result.rest}`;
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
