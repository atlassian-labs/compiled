import * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import {
  ErrorMessages,
  createErrorMessage,
  errorIfNotValidObjectProperty,
  getKeyValue,
  hasExtendedSelectorsKey as propertyHasExtendedSelectorsKey,
  isAtRuleObject,
  objectKeyIsLiteralValue,
  isPlainSelector,
} from '../utils/css-map';

function* collapseAtRule(atRuleBlock: t.ObjectProperty, atRuleType: string, meta: Metadata) {
  if (!t.isObjectExpression(atRuleBlock.value)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.AT_RULE_VALUE_TYPE),
      atRuleBlock.value,
      meta.parentPath
    );
  }

  for (const atRule of atRuleBlock.value.properties) {
    errorIfNotValidObjectProperty(atRule, meta);
    if (!objectKeyIsLiteralValue(atRule.key)) {
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.STATIC_PROPERTY_KEY),
        atRule.key,
        meta.parentPath
      );
    }

    const atRuleName = `${atRuleType} ${getKeyValue(atRule.key)}`;
    const newKey = t.identifier(atRuleName);
    yield { atRuleName, atRuleValue: { ...atRule, key: newKey } };
  }
}

const getExtendedSelectors = (
  variantStyles: t.ObjectExpression,
  meta: Metadata
): t.ObjectExpression['properties'] => {
  const extendedSelectorsFound = variantStyles.properties.filter(
    (value): value is t.ObjectProperty =>
      t.isObjectProperty(value) && propertyHasExtendedSelectorsKey(value)
  );

  if (extendedSelectorsFound.length === 0) return [];
  if (extendedSelectorsFound.length > 1) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.DUPLICATE_SELECTORS_BLOCK),
      extendedSelectorsFound[1],
      meta.parentPath
    );
  }

  const extendedSelectors = extendedSelectorsFound[0];
  if (!t.isObjectExpression(extendedSelectors.value)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.SELECTORS_BLOCK_VALUE_TYPE),
      extendedSelectors.value,
      meta.parentPath
    );
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
  const extendedSelectors = getExtendedSelectors(variantStyles, meta);
  const mergedProperties: t.ObjectProperty[] = [];
  const addedSelectors: Set<string> = new Set();

  for (const property of [...variantStyles.properties, ...extendedSelectors]) {
    // Covered by @compiled/eslint-plugin rule already,
    // this is just to make the type checker happy
    errorIfNotValidObjectProperty(property, meta);
    // Extract property.key into its own variable so we can do
    // type checking on it
    const propertyKey = property.key;

    if (!objectKeyIsLiteralValue(propertyKey)) {
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.STATIC_PROPERTY_KEY),
        property.key,
        meta.parentPath
      );
    }

    if (isPlainSelector(getKeyValue(propertyKey))) {
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.USE_SELECTORS_WITH_AMPERSAND),
        property.key,
        meta.parentPath
      );
    }

    // we have already extracted the selectors object into the `extendedSelectors`
    // variable, so we can skip it now
    if (propertyHasExtendedSelectorsKey(property)) continue;

    if (isAtRuleObject(propertyKey)) {
      const atRuleType = getKeyValue(propertyKey);
      const atRules = collapseAtRule(property, atRuleType, meta);

      for (const { atRuleName, atRuleValue } of atRules) {
        if (addedSelectors.has(atRuleName)) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.DUPLICATE_AT_RULE),
            property.key,
            meta.parentPath
          );
        }

        mergedProperties.push(atRuleValue);
        addedSelectors.add(atRuleName);
      }
    } else {
      // If the property value is an object, we can be reasonably sure that
      // the key is a CSS selector and not a CSS property (this is just an
      // assumption, because we can never be 100% sure...)
      const isSelector = t.isObjectExpression(property.value);

      if (isSelector) {
        const isDuplicateSelector = addedSelectors.has(getKeyValue(propertyKey));
        if (isDuplicateSelector) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.DUPLICATE_SELECTOR),
            property.key,
            meta.parentPath
          );
        } else {
          addedSelectors.add(getKeyValue(propertyKey));
        }
      }

      mergedProperties.push(property);
    }
  }

  return { ...variantStyles, properties: mergedProperties };
};
