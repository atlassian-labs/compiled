import * as ts from 'typescript';
import kebabCase from './kebab-case';
import { Declarations, CssVariableExpressions, ToCssReturnType } from '../types';
import { nextCssVariableName } from './identifiers';
import {
  getIdentifierText,
  getAssignmentIdentifierText,
  getAssignmentIdentifier,
  createNodeError,
} from './ast-node';
import * as logger from './log';
import { extractCssVarFromArrowFunction } from './extract-css-var-from-arrow-function';
import { templateLiteralToCss } from './template-literal-to-css';
import { addUnitIfNeeded } from './css-property';

export const objectLiteralToCssString = (
  objectLiteral: ts.ObjectLiteralExpression,
  collectedDeclarations: Declarations,
  context: ts.TransformationContext
): ToCssReturnType => {
  const properties = objectLiteral.properties;
  let cssVariables: CssVariableExpressions[] = [];

  const css: string = properties.reduce((acc, prop) => {
    let key: string;
    let value: string;

    if (ts.isSpreadAssignment(prop)) {
      let nodeToExtractCssFrom: ts.Node;

      if (ts.isCallExpression(prop.expression)) {
        // we are spreading the result of a function call e.g: css={{ ...mixin() }}
        const declaration = collectedDeclarations[getIdentifierText(prop.expression.expression)];
        const functionNode = ts.isVariableDeclaration(declaration)
          ? declaration.initializer
          : declaration;

        if (!functionNode || !ts.isArrowFunction(functionNode)) {
          throw createNodeError('how is this not a function', prop);
        }

        if (!ts.isParenthesizedExpression(functionNode.body)) {
          throw createNodeError('only function like () => ({}) supported', functionNode);
        }

        nodeToExtractCssFrom = functionNode.body.expression;
      } else {
        // we are spreading a variable e.g: css={{ ...mixin }}
        const declaration = collectedDeclarations[getIdentifierText(prop.expression)];
        if (!declaration) {
          throw createNodeError('variable not in scope', prop);
        }

        if (ts.isVariableDeclaration(declaration)) {
          if (!declaration.initializer) {
            throw createNodeError('variable declaration was not initialized', declaration);
          }
          nodeToExtractCssFrom = declaration.initializer;
        } else {
          nodeToExtractCssFrom = declaration;
        }
      }

      if (!ts.isObjectLiteralExpression(nodeToExtractCssFrom)) {
        throw createNodeError('variable not an object', nodeToExtractCssFrom);
      }
      // Spread can either be from an object, or a function. Not an array yet not supported (:
      const result = objectLiteralToCssString(nodeToExtractCssFrom, collectedDeclarations, context);
      cssVariables = cssVariables.concat(result.cssVariables);

      return `${acc}
      ${result.css}
      `;
    } else if (
      ts.isShorthandPropertyAssignment(prop) ||
      (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.initializer))
    ) {
      key = kebabCase(getIdentifierText(prop.name));
      const identifierName = getAssignmentIdentifierText(prop);

      const declaration = collectedDeclarations[identifierName];
      if (!declaration) {
        logger.log(`could not find declaration "${identifierName}", ignoring`);
      } else if (
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer &&
        ts.isObjectLiteralExpression(declaration.initializer)
      ) {
        // we are referencing an object. so we want to just parse it  and use it.
        const result = objectLiteralToCssString(
          declaration.initializer,
          collectedDeclarations,
          context
        );

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
      const result = objectLiteralToCssString(prop.initializer, collectedDeclarations, context);
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
      const propertyName = getIdentifierText(prop.name);
      const parsedValue = ts.isNumericLiteral(prop.initializer)
        ? Number(prop.initializer.text)
        : prop.initializer.text;
      key = kebabCase(propertyName);

      if (propertyName === 'content' && typeof parsedValue === 'string') {
        if (parsedValue[0] === '"' || parsedValue[0] === "'") {
          // Its already escaped, probably. Skip.
          value = parsedValue;
        } else {
          // Ensure that it has quotes around it
          value = `"${parsedValue}"`;
        }
      } else {
        value = addUnitIfNeeded(propertyName, parsedValue);
      }
    } else if (ts.isPropertyAssignment(prop) && ts.isArrowFunction(prop.initializer)) {
      key = kebabCase(getIdentifierText(prop.name));
      const cssResult = extractCssVarFromArrowFunction(prop.initializer, context);
      value = `var(${cssResult.name})`;
      cssVariables.push(cssResult);
    } else if (ts.isPropertyAssignment(prop) && ts.isTemplateExpression(prop.initializer)) {
      const result = templateLiteralToCss(prop.initializer, collectedDeclarations, context);
      const key = kebabCase(getIdentifierText(prop.name));
      cssVariables = cssVariables.concat(result.cssVariables);
      return `${acc}
        ${key}:${result.css}
      `;
    } else if (ts.isPropertyAssignment(prop) && ts.isCallExpression(prop.initializer)) {
      // We've found a call expression prop, e.g. color: lighten('ok')
      // Interrogate if it is going to return css if it doesn't just move the call expression to a css variable.
      key = kebabCase(getIdentifierText(prop.name));
      const cssVarName = `--${key}-${nextCssVariableName()}`;
      value = `var(${cssVarName})`;
      cssVariables.push({
        expression: prop.initializer,
        name: cssVarName,
      });
    } else {
      logger.log('unsupported value found in css object');
      key = prop.name ? kebabCase(getIdentifierText(prop.name)) : 'UNSUPPORTED_PROPERTY_FOUND';
      value = 'UNSUPPORTED_PROPERTY_FOUND';
    }

    return `${acc}
      ${key}: ${value};`;
  }, '');

  return {
    cssVariables,
    css,
  };
};
