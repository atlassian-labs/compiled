import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { Metadata } from '../types';

import { getPathOfNode } from './ast';
import { CONDITIONAL_PATHS } from './constants';
import { isEmptyValue } from './is-empty';

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
    noScope: true,
    ConditionalExpression(path) {
      CONDITIONAL_PATHS.map((c) => {
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
  });

  return isNested;
};

export const recomposeTemplateLiteral = (
  template: t.TemplateLiteral,
  prefix: string,
  suffix = ''
): void => {
  const { quasis } = template;
  const [leadQuasi] = quasis;
  const tailQuasi = quasis[quasis.length - 1];

  leadQuasi.value = {
    raw: `${prefix}${leadQuasi.value.raw}`,
    cooked: `${prefix}${leadQuasi.value.cooked}`,
  };

  tailQuasi.value = {
    raw: `${tailQuasi.value.raw}${suffix}`,
    cooked: `${tailQuasi.value.cooked}${suffix}`,
  };
};
/**
 * Tries to convert a conditional expression of values into `property: value`
 * to allow CSS classes to be built on each conditional branch
 * @param prefix {string}
 * @param suffix {string}
 * @param expression {t.ConditionalExpression}
 */
const optimizeConditionalExpression = (
  prefix: string,
  suffix: string,
  expression: t.ConditionalExpression
): t.ConditionalExpression => {
  const [styleProperty] = prefix.trim().split(':');
  const isValidCssProperty = styleProperty.trimEnd().match(/(-?[a-z]+)+$/);
  const isNotPartOfString = !prefix.endsWith("'") && !prefix.endsWith('"');
  // This will skip statements like
  // height: calc(100% - ${identifier} - ${conditionalExpression});
  // content: 'I contain code ${conditionalExpression});';
  // as the same technique can't applied to these scenarios
  // or their content is unpredictable
  if (isValidCssProperty && isNotPartOfString) {
    const branches = CONDITIONAL_PATHS.map((path) => {
      const branchNode = expression[path];

      if (t.isNumericLiteral(branchNode) || t.isStringLiteral(branchNode)) {
        return t.stringLiteral(`${prefix}${branchNode.value}${suffix}`);
      } else if (t.isTemplateLiteral(branchNode)) {
        recomposeTemplateLiteral(branchNode, prefix, suffix);

        return branchNode;
      } else if (t.isConditionalExpression(branchNode)) {
        return optimizeConditionalExpression(prefix, suffix, branchNode);
      } else {
        const isValueEmpty = isEmptyValue(branchNode);

        return t.templateLiteral(
          [
            t.templateElement({ raw: prefix, cooked: prefix }),
            t.templateElement({ raw: suffix, cooked: suffix }),
          ],
          [isValueEmpty ? t.stringLiteral('') : branchNode]
        );
      }
    });

    return t.conditionalExpression(expression.test, branches[0], branches[1]);
  }

  return expression;
};

/**
 * Tries to modify a CSS statement in a template literal containing conditional values to
 * output separate CSS classes for each value
 * @param quasi {t.TemplateElement}
 * @param nextQuasi {t.TemplateElement}
 * @param expression {t.ArrowFunctionExpression}
 */
export const optimizeConditionalStatement = (
  quasi: t.TemplateElement,
  nextQuasi: t.TemplateElement,
  expression: t.ArrowFunctionExpression
): void => {
  const quasiValue = quasi.value.raw;
  // Breaks down quasi into individual statements
  const quasiStatements = quasiValue.split(/[;|{|}]/g);
  // Any string that is mid statement should be the last item
  // as it should be interupted by an expression
  const prefix = quasiStatements[quasiStatements.length - 1];
  const nextQuasiValue = nextQuasi?.value.raw ?? '';
  const endOfStatementIndex = nextQuasiValue.indexOf(';');
  const nextQuasiEndsStatement = endOfStatementIndex !== -1;

  if (t.isConditionalExpression(expression.body) && prefix && nextQuasiEndsStatement) {
    const suffix = nextQuasiValue.substring(0, endOfStatementIndex);
    const optimizedConditional = optimizeConditionalExpression(prefix, suffix, expression.body);

    if (optimizedConditional !== expression.body) {
      const quasiValueWithoutPrefix = quasiValue.substring(0, quasiValue.lastIndexOf(prefix));

      expression.body = optimizedConditional;
      quasi.value = { raw: quasiValueWithoutPrefix, cooked: quasiValueWithoutPrefix };

      if (nextQuasi) {
        const quasiValueWithoutSuffix = nextQuasiValue.substring(endOfStatementIndex + 1);
        nextQuasi.value = { raw: quasiValueWithoutSuffix, cooked: quasiValueWithoutSuffix };
      }
    }
  }
};

/**
 * Checks if quasi ends in an incomplete statement
 * @param quasi {t.TemplateElement}
 */
export const isQuasiMidStatement = (quasi: t.TemplateElement): boolean => {
  const {
    value: { raw },
  } = quasi;
  // Remove any comments (/* ... */) then trim
  const stringValue = raw.replace(/\/\*(.|\n)*?\*\//g, '').trimEnd();

  return (
    Boolean(stringValue) &&
    !stringValue.endsWith(';') &&
    !stringValue.endsWith('{') &&
    !stringValue.endsWith('}')
  );
};
