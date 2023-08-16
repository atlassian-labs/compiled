import * as t from '@babel/types';

import type { Metadata } from '../types';

import { buildCodeFrameError } from './ast';
import { createResultPair } from './create-result-pair';
import { evaluateIdentifier } from './traverse-expression/traverse-member-expression/traverse-access-path/resolve-expression/identifier';
import type { EvaluateExpression } from './types';

const createErrorMessage = (message?: string): string => {
  return `
${
  message || 'Using a CSS Map in this manner is incorrect.'
} To correctly implement a CSS Map, follow the syntax below:

\`\`\`
import { css, cssMap } from '@compiled/react';
const borderStyleMap = cssMap({
    none: { borderStyle: 'none' },
    solid: { borderStyle: 'solid' },
});
const Component = ({ borderStyle }) => <div css={css(borderStyleMap[borderStyle])} />
\`\`\`
    `;
};

/**
 * Retrieves the leftmost identity from a given expression.
 *
 * For example:
 * Given a member expression "colors.primary.500", the function will return "colors".
 *
 * @param expression The expression to be evaluated.
 * @returns {string} The leftmost identity in the expression.
 */
const findBindingIdentifier = (
  expression: t.Expression | t.V8IntrinsicIdentifier
): t.Identifier | undefined => {
  if (t.isIdentifier(expression)) {
    return expression;
  } else if (t.isCallExpression(expression)) {
    return findBindingIdentifier(expression.callee);
  } else if (t.isMemberExpression(expression)) {
    return findBindingIdentifier(expression.object);
  }

  return undefined;
};

/**
 * Retrieves the CSS Map related information from a given expression.
 *
 * @param expression The expression to be evaluated.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 * @param evaluateExpression {EvaluateExpression} Function that evaluates an expression
 */
const getCssMap = (
  expression: t.Expression,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
):
  | {
      value: t.ObjectExpression;
      meta: Metadata;
      property: t.Identifier | t.StringLiteral;
      computed: boolean;
    }
  | undefined => {
  // Bail out early if cssMap callExpression doesn't exist in the file
  if (!meta.state.compiledImports?.cssMap) return undefined;

  // We only care about member expressions. e.g. variants[variant]
  if (!t.isMemberExpression(expression)) return undefined;

  const bindingIdentifier = findBindingIdentifier(expression.object);

  if (!bindingIdentifier) return undefined;

  // Evaluate the binding identifier to get the value of the CSS Map
  const { value, meta: updatedMeta } = evaluateIdentifier(
    bindingIdentifier,
    meta,
    evaluateExpression
  );

  // Ensure cssMap is used in a correct format.
  if (
    t.isCallExpression(value) &&
    t.isIdentifier(value.callee) &&
    value.callee.name === meta.state.compiledImports?.cssMap &&
    value.arguments.length > 0 &&
    t.isObjectExpression(value.arguments[0])
  ) {
    // It's CSS Map! We now need to check if the use of the CSS Map is correct.
    if (t.isCallExpression(expression.object)) {
      throw buildCodeFrameError(createErrorMessage(), expression, updatedMeta.parentPath);
    }

    if (t.isMemberExpression(expression.object)) {
      throw buildCodeFrameError(
        createErrorMessage('You cannot access a nested CSS Map.'),
        expression,
        updatedMeta.parentPath
      );
    }

    if (!t.isIdentifier(expression.property) && !t.isStringLiteral(expression.property)) {
      throw buildCodeFrameError(createErrorMessage(), expression, updatedMeta.parentPath);
    }

    return {
      value: value.arguments[0],
      property: expression.property,
      computed: expression.computed,
      meta: updatedMeta,
    };
  }

  // It's not a CSS Map, let other code handle it
  return undefined;
};

export const isCSSMap = (
  expression: t.Expression,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): boolean => {
  return getCssMap(expression, meta, evaluateExpression) !== undefined;
};

/**
 * Transform expression that uses a CSS Map into an array of logical expressions.
 * For example:
 * ```js
 * const borderStyleMap = cssMap({
 *   none: { borderStyle: 'none' },
 *   solid: { borderStyle: 'solid' },
 * });
 * const Component = ({ borderStyle }) => <div css={css(borderStyleMap[borderStyle])} />
 * ```
 * gets transformed into:
 * ```js
 * const Component = ({ borderStyle }) => <div css={css([
 *   borderStyle === 'none' && { borderStyle: 'none' },
 *   borderStyle === 'solid' && { borderStyle: 'solid'}
 * ])} />
 * ```
 * Throw an error if a valid CSS Map is not provided.
 *
 * @param expression Expression we want to evulate.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const evaluateCSSMap = (
  expression: t.Expression,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): ReturnType<typeof createResultPair> => {
  const result = getCssMap(expression, meta, evaluateExpression);

  // It should never happen because `isCSSMap` should have been checked already.
  if (!result) throw buildCodeFrameError(createErrorMessage(), expression, meta.parentPath);

  const { value: objectExpression, property: objectProperty, computed, meta: updatedMeta } = result;

  return createResultPair(
    t.arrayExpression(
      objectExpression.properties.map((property) => {
        if (
          !t.isObjectProperty(property) ||
          !t.isIdentifier(property.key) ||
          !t.isExpression(property.value)
        )
          throw buildCodeFrameError(createErrorMessage(), expression, updatedMeta.parentPath);

        return t.logicalExpression(
          '&&',
          t.binaryExpression(
            '===',
            t.isStringLiteral(objectProperty)
              ? objectProperty
              : computed
              ? objectProperty
              : t.stringLiteral(objectProperty.name),
            t.stringLiteral(property.key.name)
          ),
          property.value
        );
      })
    ),
    updatedMeta
  );
};
