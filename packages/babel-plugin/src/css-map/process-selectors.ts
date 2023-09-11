import type * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import {
  ErrorMessages,
  createErrorMessage,
  getKeyValue,
  hasExtendedSelectorsKey,
  isAtRule,
  objectKeyIsLiteralValue,
} from '../utils/css-map';

function errorIfNotValidObjectProperty(
  property: t.ObjectExpression['properties'][number],
  meta: Metadata
): asserts property is t.ObjectProperty {
  if (property.type === 'ObjectMethod') {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.NO_OBJECT_METHOD),
      property.key,
      meta.parentPath
    );
  } else if (property.type === 'SpreadElement') {
    throw new Error(
      `cssMap does not support object methods and spread elements (e.g. "...myArray").`
    );
  }
}

function* collapseAtRule(atRuleBlock: t.ObjectProperty, atRuleType: string, meta: Metadata) {
  if (atRuleBlock.value.type !== 'ObjectExpression') {
    throw new Error(`Value of at rule block '${atRuleType}' must be an object.`);
  }

  for (const atRule of atRuleBlock.value.properties) {
    errorIfNotValidObjectProperty(atRule, meta);
    if (!objectKeyIsLiteralValue(atRule.key)) {
      throw new Error(
        `The keys of the at rule block '${atRuleType}' must be a simple string literal.`
      );
    }

    const atRuleName = `${atRuleType} ${getKeyValue(atRule.key)}`;
    const newKey = { ...atRule.key, value: atRuleName };
    yield { atRuleName, atRuleValue: { ...atRule, key: newKey } };
  }
}

const getExtendedSelectors = (
  variantStyles: t.ObjectExpression
): t.ObjectExpression['properties'] => {
  const extendedSelectorsFound = variantStyles.properties.filter(
    (value): value is t.ObjectProperty =>
      value.type === 'ObjectProperty' && hasExtendedSelectorsKey(value)
  );

  if (extendedSelectorsFound.length === 0) return [];
  if (extendedSelectorsFound.length > 1) {
    throw new Error(
      'Duplicate `selectors` key found in cssMap; expected either zero `selectors` keys or one.'
    );
  }

  const extendedSelectors = extendedSelectorsFound[0];
  if (extendedSelectors.value.type !== 'ObjectExpression') {
    throw new Error('Value of `selectors` key must be an object.');
  }

  return extendedSelectors.value.properties;
};

/**
 * Given an object defined within an variant passed to `cssMap`, convert this object to
 * a less idiosyncratic form that can be directly processed by `buildCss`.
 *
 * For example, if our object is this:
 *
 *     {
 *       color: 'blue',
 *       '&:hover': {
 *         color: 'yellow',
 *       },
 *       '@media': {
 *         'screen and (min-width: 500px)': { ... }
 *         'screen and (min-width: 700px)': { ... }
 *       },
 *       selectors: {
 *         div: { color: 'orange' },
 *       }
 *     }
 *
 * This function will merge the two halves of the `@media` query (for example, to get
 * `@media screen and (min-width: 500px)`), and it will merge all of
 * the keys located in the value of `selectors`:
 *
 *     {
 *       color: 'blue',
 *       '&:hover': {
 *         color: 'yellow',
 *       },
 *       '@media screen and (min-width: 500px)': { ... }
 *       '@media screen and (max-width: 700px)': { ... }
 *       div: { color: 'orange' },
 *     }
 *
 * @param variantStyles an object expression representing the value of the cssMap variant
 * @param meta metadata from Babel, used for error messages
 * @returns the processed object expression
 */
export const mergeExtendedSelectorsIntoProperties = (
  variantStyles: t.ObjectExpression,
  meta: Metadata
): t.ObjectExpression => {
  const extendedSelectors = getExtendedSelectors(variantStyles);
  const mergedProperties: t.ObjectProperty[] = [];
  const addedPropertyKeys: Set<string> = new Set();

  for (const property of [...variantStyles.properties, ...extendedSelectors]) {
    // Covered by ESLint rule already
    errorIfNotValidObjectProperty(property, meta);

    // we have already extracted the selectors object into the `extendedSelectors`
    // variable, so we can skip it now
    if (hasExtendedSelectorsKey(property)) continue;

    if (objectKeyIsLiteralValue(property.key) && isAtRule(property.key)) {
      const atRuleType = getKeyValue(property.key);
      const atRules = collapseAtRule(property, atRuleType, meta);

      for (const { atRuleName, atRuleValue } of atRules) {
        if (addedPropertyKeys.has(atRuleName)) {
          throw new Error(
            `This at rule was found more than once in the cssMap object: \`${atRuleName}\`\n` +
              'You may only specify this selector once.'
          );
        }
        mergedProperties.push(atRuleValue);
        addedPropertyKeys.add(atRuleName);
      }
    } else {
      if (
        // If the value is an object, we can be reasonably sure that the key is a CSS selector
        // and not a CSS property
        property.value.type === 'ObjectExpression' &&
        objectKeyIsLiteralValue(property.key) &&
        addedPropertyKeys.has(getKeyValue(property.key))
      ) {
        throw new Error(
          `This selector was found more than once in the cssMap object: \`${getKeyValue(
            property.key
          )}\`\nYou may only specify this selector once.`
        );
      }
      mergedProperties.push(property);
      if (property.key.type === 'Identifier') {
        addedPropertyKeys.add(property.key.name);
      } else if (property.key.type === 'StringLiteral') {
        addedPropertyKeys.add(property.key.value);
      }
    }
  }

  return { ...variantStyles, properties: mergedProperties };
};
