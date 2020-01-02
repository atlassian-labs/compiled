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

const getCssVariableFromArrowFunction = (
  node: ts.ArrowFunction,
  context: ts.TransformationContext
): CssVariableExpressions => {
  let identifier: ts.Identifier = ts.createIdentifier('');
  let name: string = '';

  const visitor = (node: ts.Node) => {
    if (ts.isPropertyAccessExpression(node)) {
      identifier = ts.createIdentifier(node.getText());
      name = `--${node.name.escapedText}-${nextCssVariableName()}`;
    }

    return node;
  };

  ts.visitEachChild(node, visitor, context);

  return { identifier, name };
};

export const objectLiteralToCssString = (
  objectLiteral: ts.ObjectLiteralExpression,
  collectedDeclarations: VariableDeclarations,
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
        const functionDeclaration =
          collectedDeclarations[getIdentifierText(prop.expression.expression)];
        const functionNode = functionDeclaration.initializer;

        if (!functionNode || !ts.isArrowFunction(functionNode)) {
          throw new Error('how is this not a function');
        }

        if (!ts.isParenthesizedExpression(functionNode.body)) {
          throw new Error('only function like () => ({}) supported');
        }

        nodeToExtractCssFrom = functionNode.body.expression;
      } else {
        // we are spreading a variable e.g: css={{ ...mixin }}
        const variableDeclaration = collectedDeclarations[getIdentifierText(prop.expression)];
        if (!variableDeclaration || !variableDeclaration.initializer) {
          throw new Error('variable not in scope');
        }
        nodeToExtractCssFrom = variableDeclaration.initializer;
      }

      if (!ts.isObjectLiteralExpression(nodeToExtractCssFrom)) {
        throw new Error('variable not an object');
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

      const variableDeclaration = collectedDeclarations[identifierName];
      if (!variableDeclaration || !variableDeclaration.initializer) {
        logger.log(`could not find variable "${identifierName}", ignoring`);
      } else if (
        variableDeclaration &&
        variableDeclaration.initializer &&
        ts.isObjectLiteralExpression(variableDeclaration.initializer)
      ) {
        // we are referencing an object. so we want to just parse it  and use it.
        const result = objectLiteralToCssString(
          variableDeclaration.initializer,
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
        identifier: getAssignmentIdentifier(prop),
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
      key = kebabCase(getIdentifierText(prop.name));
      value = `${prop.initializer.text}`;
    } else if (ts.isPropertyAssignment(prop) && ts.isArrowFunction(prop.initializer)) {
      key = kebabCase(getIdentifierText(prop.name));
      const cssResult = getCssVariableFromArrowFunction(prop.initializer, context);
      value = `var(${cssResult.name})`;
      cssVariables.push(cssResult);
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
