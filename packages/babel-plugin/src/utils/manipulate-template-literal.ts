import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { Metadata } from '../types';

import { getPathOfNode } from './ast';

const conditionalPaths: ['consequent', 'alternate'] = ['consequent', 'alternate'];

/**
 * Returns `true` if the CSS property is defined within a template element
 * (the string pieces of the template literal)
 * rather than in the expression.
 * Eg color: ${({ isPrimary }) => (isPrimary ? 'green' : 'red')};
 * @param node
 */
export const isCssPropertyInTemplateElement = (node: t.TemplateElement): boolean => {
  const re = /(\s.[a-z.\-_]*?\:)/; // `property:`
  const value = node.value.raw;

  return re.test(value);
};

/**
 * TODO: this is a temporary workaround so that we don't evaluate expressions that may throw an error.
 * It should be removed after addressing https://github.com/atlassian-labs/compiled/issues/1081
 *
 * Returns `true` if there is another conditional expression
 * at the root of the current template literal with a conditional expression to evaluate
 *
 * @param node
 * @param meta {Metadata} The current metadata to use to find the parent node
 */
export const hasNestedTemplateLiteralsWithConditionalExpressions = (
  node: t.TemplateLiteral,
  meta: Metadata
): boolean => {
  const expressionPath = getPathOfNode(node, meta.parentPath);
  const parent = expressionPath.parent;
  let isNested = false;

  traverse(parent, {
    noScope: true,
    ConditionalExpression(path) {
      conditionalPaths.map((c) => {
        const expression = path.node[c];

        if (t.isTaggedTemplateExpression(expression)) {
          if (expression.quasi === node) {
            isNested = true;
            path.stop();
          }
        }
      });
    },
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
 */
export const moveCssPropertyInExpression = (
  expression: t.ConditionalExpression,
  quasi: t.TemplateElement,
  nextQuasis: t.TemplateElement,
  deleteValue = true
): void => {
  const value = quasi.value.raw;
  const re = /([^;/]+$)/; // everything after the last ';'
  const before = value.match(re)?.[0] || '';
  const closingBracket = before.includes('{') ? ';}' : '';

  if (!before) {
    return;
  }

  conditionalPaths.map((path) => {
    const pathNode = expression[path];
    if (t.isStringLiteral(pathNode) && pathNode.value) {
      // We've found a string literal like: `'blue'`
      pathNode.value = before + pathNode.value + closingBracket;
    } else if (t.isTemplateLiteral(pathNode)) {
      // We've found a template literal like: "`${fontSize}px`"
      pathNode.quasis[0].value.raw = before + pathNode.quasis[0].value.raw + closingBracket;
    } else if (t.isNumericLiteral(pathNode)) {
      // We've found a numeric literal like: `1`
      expression[path] = t.stringLiteral(before + pathNode.value + closingBracket);
    } else if (t.isIdentifier(pathNode)) {
      const identifierExpression = [pathNode];
      const identifierQuasis = [
        t.templateElement({ raw: before, cooked: before }),
        t.templateElement({ raw: '', cooked: '' }),
      ];
      expression[path] = t.templateLiteral(identifierQuasis, identifierExpression);
    } else if (t.isConditionalExpression(pathNode)) {
      // We've found nested ternary operators
      moveCssPropertyInExpression(pathNode, quasi, nextQuasis, false);
    } else if (t.isMemberExpression(pathNode)) {
      // We've found a member expression like `colors.N50`
      // TODO handle member expression
      deleteValue = false;
      return;
    }
  });

  // Remove CSS property so it doesn't get processed again
  if (deleteValue) {
    quasi.value.raw = value.replace(before, '');
    quasi.value.cooked = value.replace(before, '');

    if (closingBracket) {
      const rex = /([^}/]+$)/g; // everything after the last '}'
      const after = nextQuasis.value.raw.match(rex)?.[0] || '';
      nextQuasis.value.raw = after;
      nextQuasis.value.cooked = after;
    }
  }
};
