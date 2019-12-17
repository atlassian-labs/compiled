import * as ts from 'typescript';
import kebabCase from './kebab-case';
import { VariableDeclarations, CssVariableExpressions, ToCssReturnType } from '../types';
import { nextCssVariableName } from './identifiers';
import {
  getIdentifierText,
  getAssignmentIdentifierText,
  getAssignmentIdentifier,
} from './ast-node';
import * as logger from './log';

export const objectLiteralToCssString = (
  objectLiteral: ts.ObjectLiteralExpression,
  scopedVariables: VariableDeclarations
): ToCssReturnType => {
  const properties = objectLiteral.properties;
  let cssVariables: CssVariableExpressions[] = [];

  const css: string = properties.reduce((acc, prop) => {
    let key: string;
    let value: string;

    if (ts.isSpreadAssignment(prop)) {
      let nodeToExtractCssFrom: ts.Node;

      if (ts.isCallExpression(prop.expression)) {
        // we are spreading the result of a function call
        const functionDeclaration = scopedVariables[getIdentifierText(prop.expression.expression)];
        const functionNode = functionDeclaration.initializer;

        if (!functionNode || !ts.isArrowFunction(functionNode)) {
          throw new Error('how is this not a function');
        }

        if (!ts.isParenthesizedExpression(functionNode.body)) {
          throw new Error('only function like () => ({}) supported');
        }

        nodeToExtractCssFrom = functionNode.body.expression;
      } else {
        // we are spreading a variable
        const variableDeclaration = scopedVariables[getIdentifierText(prop.expression)];
        if (!variableDeclaration || !variableDeclaration.initializer) {
          throw new Error('variable not in scope');
        }
        nodeToExtractCssFrom = variableDeclaration.initializer;
      }

      if (!ts.isObjectLiteralExpression(nodeToExtractCssFrom)) {
        throw new Error('variable not an object');
      }
      // Spread can either be from an object, or a function. Probably not an array.

      const result = objectLiteralToCssString(nodeToExtractCssFrom, scopedVariables);
      cssVariables = cssVariables.concat(result.cssVariables);

      return `${acc}
      ${result.css}
      `;
    } else if (
      ts.isShorthandPropertyAssignment(prop) ||
      (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.initializer))
    ) {
      key = kebabCase(getIdentifierText(prop.name));

      const variableDeclaration = scopedVariables[getAssignmentIdentifierText(prop)];
      if (!variableDeclaration || !variableDeclaration.initializer) {
        logger.log('variable not found');
      }
      if (
        variableDeclaration &&
        variableDeclaration.initializer &&
        ts.isObjectLiteralExpression(variableDeclaration.initializer)
      ) {
        // we are referencing an object. so we want to just parse it  and use it.
        const result = objectLiteralToCssString(variableDeclaration.initializer, scopedVariables);
        cssVariables = cssVariables.concat(result.cssVariables);
        return `${acc}
        ${key} {
          ${result.css}
        }
        `;
      }

      // We have a prop assignment using a SIMPLE variable, e.g. "fontSize: props.fontSize" or "fontSize".
      // Time to turn it into a css variable.
      const cssVariable = `--${key}-${nextCssVariableName()}`;
      value = `var(${cssVariable})`;
      cssVariables.push({
        name: cssVariable,
        expression: getAssignmentIdentifier(prop),
      });
    } else if (ts.isPropertyAssignment(prop) && ts.isObjectLiteralExpression(prop.initializer)) {
      key = kebabCase((prop.name as ts.Identifier).text);

      // We found an object selector, e.g. ":hover": { color: 'red' }
      const result = objectLiteralToCssString(prop.initializer, scopedVariables);
      cssVariables = cssVariables.concat(result.cssVariables);

      return `${acc}
      ${key} {
        ${result.css}
      }
      `;
    } else if (
      ts.isPropertyAssignment(prop) &&
      (ts.isStringLiteral(prop.initializer) || ts.isNumericLiteral(prop.initializer))
    ) {
      // We have a regular static assignment, e.g. "fontSize: '20px'"
      key = kebabCase(getIdentifierText(prop.name));
      value = `${prop.initializer.text}`;
    } else {
      logger.log('unsupported value in css prop object');
      key = prop.name ? kebabCase(getIdentifierText(prop.name)) : 'unspported';
      value = 'unsupported';
    }

    return `${acc}
      ${key}: ${value};`;
  }, '');

  return {
    cssVariables,
    css,
  };
};
