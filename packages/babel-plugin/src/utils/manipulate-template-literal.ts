import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { cssAffixInterpolation } from '@compiled/css';

import type { Metadata } from '../types';

import { getPathOfNode } from './ast';

const conditionalPaths: ['consequent', 'alternate'] = ['consequent', 'alternate'];

/**
 * Returns `true` if the CSS property or pseudo classes/pseudo elements
 * are defined within a template element (the string pieces of the template literal)
 * rather than in the expression.
 *
 * For example
 * - CSS property: `color: ${({ isPrimary }) => (isPrimary ? 'green' : 'red')};`
 * - Pseudo class: `hover: ${({ isPrimary }) => (isPrimary ? 'color:green' : 'color:red')};`
 * - Pseudo element: `:before {${({ isPrimary }) => (isPrimary ? 'color: green' : 'color:red')}};`
 * @param node
 */
export const isCssPropertyInTemplateElement = (node: t.TemplateElement): boolean => {
  const value = node.value.raw;

  return value.includes(':');
};

/**
 * TODO: this is a temporary workaround so that we don't evaluate expressions that may throw an error.
 * It should be removed after addressing https://github.com/atlassian-labs/compiled/issues/1081
 *
 * Returns `true` if
 * - there is another conditional expression at the root of the current template literal
 *   with a conditional expression to evaluate OR
 * - there is a nested logical expression within the current template literal
 *
 * @param node
 * @param meta {Metadata} The current metadata to use to find the parent node
 */
export const hasNestedTemplateLiteralsWithConditionalRules = (
  node: t.TemplateLiteral,
  meta: Metadata
): boolean => {
  const expressionPath = getPathOfNode(node, meta.parentPath);
  const { parent } = expressionPath;
  let isNested = false;

  traverse(parent, {
    ConditionalExpression(path) {
      conditionalPaths.map((c) => {
        const expression = path.node[c];

        if (
          (t.isTaggedTemplateExpression(expression) && expression.quasi === node) ||
          (t.isTemplateLiteral(expression) &&
            expression.expressions.some((expressionNode) =>
              t.isArrowFunctionExpression(expressionNode)
            )) ||
          t.isLogicalExpression(expression)
        ) {
          isNested = true;
          path.stop();
        }
      });
    },
    noScope: true,
  });

  return isNested;
};

/**
 * Manipulates template literal so that it resembles
 * CSS `property: value` declaration where
 * - before: all the CSS _before_ the interpolation
 * - after: all the CSS _after_ the interpolation
 * @param expression
 * @param quasi
 * @param nextQuasis
 */
export const moveCssPropertyInExpression = (
  expression: t.ConditionalExpression,
  quasi: t.TemplateElement,
  nextQuasis: t.TemplateElement,
  deleteValue = true
): void => {
  const value = quasi.value.raw;
  const parts = value.split(';');
  const before = parts[parts.length - 1]; // everything after the last ';'. Hence, after the last CSS declaration
  const [, nextQuasisExtractedCss] = cssAffixInterpolation('', nextQuasis.value.raw);
  const closingBracket = before.includes('{') ? ';}' : '';
  const after = nextQuasisExtractedCss.variableSuffix + closingBracket;

  if (!before) {
    return;
  }

  conditionalPaths.map((path) => {
    const pathNode = expression[path];
    if (t.isStringLiteral(pathNode) && pathNode.value) {
      // We've found a string literal like: `'blue'`
      pathNode.value = before + pathNode.value + after;
    } else if (t.isTemplateLiteral(pathNode)) {
      // We've found a template literal like: "`${fontSize}px`"
      pathNode.quasis[0].value.raw = before + pathNode.quasis[0].value.raw + after;
    } else if (t.isNumericLiteral(pathNode)) {
      // We've found a numeric literal like: `1`
      expression[path] = t.stringLiteral(before + pathNode.value + after);
    } else if (t.isIdentifier(pathNode)) {
      const identifierExpression = [pathNode];
      const identifierQuasis = [
        t.templateElement({ cooked: before, raw: before }),
        t.templateElement({ cooked: after, raw: after }),
      ];
      expression[path] = t.templateLiteral(identifierQuasis, identifierExpression);
    } else if (t.isMemberExpression(pathNode)) {
      // We've found a member expression like `colors.N50`
      const memberExpression = [pathNode];
      const memberQuasis = [
        t.templateElement({ cooked: before, raw: before }),
        t.templateElement({ cooked: after, raw: after }),
      ];
      expression[path] = t.templateLiteral(memberQuasis, memberExpression);
    } else if (t.isConditionalExpression(pathNode)) {
      // We've found nested ternary operators
      moveCssPropertyInExpression(pathNode, quasi, nextQuasis, false);
    } else {
      deleteValue = false;
      return;
    }
  });

  // Remove CSS property so it doesn't get processed again
  if (deleteValue) {
    let nextQuasisNewCSS = nextQuasisExtractedCss.css;

    quasi.value.raw = value.replace(before, '');
    quasi.value.cooked = value.replace(before, '');

    if (closingBracket) {
      const rex = /([^}/]+$)/g; // everything after the last '}'
      nextQuasisNewCSS = nextQuasis.value.raw.match(rex)?.[0] || '';
    }

    nextQuasis.value.raw = nextQuasisNewCSS;
    nextQuasis.value.cooked = nextQuasisNewCSS;
  }
};
