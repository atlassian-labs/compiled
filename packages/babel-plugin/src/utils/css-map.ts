import assert from 'assert';

import * as t from '@babel/types';

import type { Metadata } from '../types';

import { buildCodeFrameError } from './ast';
import { createResultPair } from './create-result-pair';
import { evaluateIdentifier } from './traverse-expression/traverse-member-expression/traverse-access-path/resolve-expression/identifier';
import type { EvaluateExpression } from './types';

// The messages are exported for testing.
export enum ErrorMessages {
  NUMBER_OF_ARGUMENT = 'You must provide cssMap with only one argument.',
  ARGUMENT_TYPE = 'cssMap can receive object only.',
  NESTED_VARIANT = 'You cannot access a nested CSS Map.',
  VARIANT_CALL_EXPRESSION = 'You cannot use a function call to access a CSS Map.',
  VARIANT_ACCESS = "You cannot access a CSS Map this way. Please use a string literal (e.g. styles['variantName']) or an identifier (e.g. styles[variantName]).",
  STATIC_VARIANT_OBJECT = 'You must statically define variant object.',
  STATIC_VARIANT_KEY = 'You must statically define variant keys.',
}

const createErrorMessage = (message: string): string => {
  return `
${message} 
To correctly implement a CSS Map, follow the syntax below:

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
 * Retrieves the key from a given expression or property from a given member expression.
 *
 * For example:
 * Given a member expression `colors[variant]`, the function will return `variant` (as t.Identifier).
 * Given a member expression `colors["variant"]`, the function will return `"variant"` (as t.StringLiteral).
 * Given a member expression `colors.variant, the function will return `"variant"` (as t.StringLiteral).
 * Given a member expression `colors.variant.nested, the function will return `undefined`.
 * Given a object property `{ variant: 'something' }`, the function will return `"variant"` (as t.StringLiteral).
 * Given a object property `{ "variant": 'something' }`, the function will return `"variant"` (as t.StringLiteral).
 * Given a object property `{ [someDynamicVariable]: 'something' }`, the function will return `undefined`.
 *
 * @param {t.ObjectProperty | t.MemberExpression} The expression to be evaluated.
 * @returns {t.Identifier | t.StringLiteral | undefined} The key or property from the expression.
 */
const getKeyOrProperty = (
  value: t.ObjectProperty | t.MemberExpression
): t.Identifier | t.StringLiteral | undefined => {
  const keyOrProperty = t.isObjectProperty(value) ? value.key : value.property;

  if (t.isStringLiteral(keyOrProperty)) {
    return keyOrProperty;
  }

  if (t.isIdentifier(keyOrProperty)) {
    if (t.isObjectProperty(value) && value.computed) return undefined;
    return value.computed ? keyOrProperty : t.stringLiteral(keyOrProperty.name);
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
      property: t.Identifier | t.StringLiteral;
      meta: Metadata;
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
    value.callee.name === meta.state.compiledImports?.cssMap
  ) {
    // It's CSS Map! We now need to check a few things to ensure CSS Map is correctly used.
    // We need to ensure cssMap receives only one argument.
    if (value.arguments.length !== 1) {
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.NUMBER_OF_ARGUMENT),
        value,
        updatedMeta.parentPath
      );
    }

    // We need to ensure the argument is an objectExpression.
    if (!t.isObjectExpression(value.arguments[0])) {
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.ARGUMENT_TYPE),
        value,
        updatedMeta.parentPath
      );
    }

    // We need to ensure callExpression isn't used to access a variant.
    if (t.isCallExpression(expression.object)) {
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.VARIANT_CALL_EXPRESSION),
        expression.object,
        meta.parentPath
      );
    }

    // We disallows a nested CSS Map. e.g. { danger: { veryDanger: { ... } } }
    if (t.isMemberExpression(expression.object)) {
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.NESTED_VARIANT),
        expression.object,
        meta.parentPath
      );
    }

    // We need to ensure the cssMap is accessed using a string literal or an identifier.
    const property = getKeyOrProperty(expression);
    if (!property) {
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.VARIANT_ACCESS),
        expression.property,
        meta.parentPath
      );
    }

    return {
      value: value.arguments[0],
      property,
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
  assert(result !== undefined);

  const { value: cssMapObjectExpression, property: selectedVariant, meta: updatedMeta } = result;

  return createResultPair(
    t.arrayExpression(
      cssMapObjectExpression.properties.map((property) => {
        if (!t.isObjectProperty(property) || !t.isExpression(property.value))
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            cssMapObjectExpression,
            updatedMeta.parentPath
          );

        const variant = getKeyOrProperty(property);

        if (!variant)
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_KEY),
            cssMapObjectExpression,
            updatedMeta.parentPath
          );

        return t.logicalExpression(
          '&&',
          t.binaryExpression('===', selectedVariant, variant),
          property.value
        );
      })
    ),
    updatedMeta
  );
};
