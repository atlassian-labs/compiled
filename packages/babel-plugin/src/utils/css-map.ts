import * as t from '@babel/types';
import type { AtRules } from 'csstype';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';

export const EXTENDED_SELECTORS_KEY = 'selectors';

const atRules: Record<AtRules, boolean> = {
  '@charset': true,
  '@counter-style': true,
  '@document': true,
  '@font-face': true,
  '@font-feature-values': true,
  '@font-palette-values': true,
  '@import': true,
  '@keyframes': true,
  '@layer': true,
  '@media': true,
  '@namespace': true,
  '@page': true,
  '@property': true,
  '@scope': true,
  '@scroll-timeline': true,
  '@starting-style': true,
  '@supports': true,
  '@viewport': true,
};

type ObjectKeyWithLiteralValue = t.Identifier | t.StringLiteral;

export const objectKeyIsLiteralValue = (
  key: t.ObjectProperty['key']
): key is ObjectKeyWithLiteralValue => t.isIdentifier(key) || t.isStringLiteral(key);

export const getKeyValue = (key: ObjectKeyWithLiteralValue): string => {
  if (t.isIdentifier(key)) return key.name;
  else if (t.isStringLiteral(key)) return key.value;
  throw new Error(`Expected an identifier or a string literal, got type ${(key as any).type}`);
};

export const isAtRuleObject = (
  key: ObjectKeyWithLiteralValue
): key is ObjectKeyWithLiteralValue => {
  const keyValue = getKeyValue(key);
  return keyValue in atRules;
};

export const isPlainSelector = (selector: string): boolean => selector.startsWith(':');

export const hasExtendedSelectorsKey = (property: t.ObjectProperty): boolean =>
  objectKeyIsLiteralValue(property.key) && getKeyValue(property.key) === EXTENDED_SELECTORS_KEY;

export function errorIfNotValidObjectProperty(
  property: t.ObjectExpression['properties'][number],
  meta: Metadata
): asserts property is t.ObjectProperty {
  if (t.isObjectMethod(property)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.NO_OBJECT_METHOD),
      property.key,
      meta.parentPath
    );
  } else if (t.isSpreadElement(property)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.NO_SPREAD_ELEMENT),
      property.argument,
      meta.parentPath
    );
  }
}

// The messages are exported for testing.

export enum ErrorMessages {
  NO_TAGGED_TEMPLATE = 'cssMap function cannot be used as a tagged template expression.',
  NUMBER_OF_ARGUMENT = 'cssMap function can only receive one argument.',
  ARGUMENT_TYPE = 'cssMap function can only receive an object.',
  AT_RULE_VALUE_TYPE = 'Value of at-rule block must be an object.',
  SELECTORS_BLOCK_VALUE_TYPE = 'Value of `selectors` key must be an object.',
  DEFINE_MAP = 'CSS Map must be declared at the top-most scope of the module.',
  NO_SPREAD_ELEMENT = 'Spread element is not supported in CSS Map.',
  NO_OBJECT_METHOD = 'Object method is not supported in CSS Map.',
  STATIC_VARIANT_OBJECT = 'The variant object must be statically defined.',
  DUPLICATE_AT_RULE = 'Cannot declare an at-rule more than once in CSS Map.',
  DUPLICATE_SELECTOR = 'Cannot declare a selector more than once in CSS Map.',
  DUPLICATE_SELECTORS_BLOCK = 'Duplicate `selectors` key found in cssMap; expected either zero `selectors` keys or one.',
  STATIC_PROPERTY_KEY = 'Property key may only be a static string.',
  SELECTOR_BLOCK_WRONG_PLACE = '`selector` key was defined in the wrong place.',
  USE_SELECTORS_WITH_AMPERSAND = 'This selector is applied to the parent element, and so you need to specify the ampersand symbol (&) directly before it. For example, `:hover` should be written as `&:hover`.',
  USE_VARIANT_OF_CSS_MAP = 'You must use the variant of a CSS Map object (eg. `styles.root`), not the root object itself, eg. `styles`.',
}

export const createErrorMessage = (message: string): string => {
  return `
${message}

Check out our documentation for cssMap examples: https://compiledcssinjs.com/docs/api-cssmap
`;
};
