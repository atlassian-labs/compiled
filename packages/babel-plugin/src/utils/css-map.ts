import * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';

export const EXTENDED_SELECTORS_KEY = 'selectors';

type ObjectKeyWithLiteralValue = t.Identifier | t.StringLiteral;

export const objectKeyIsLiteralValue = (
  key: t.ObjectProperty['key']
): key is ObjectKeyWithLiteralValue => t.isIdentifier(key) || t.isStringLiteral(key);

export const getKeyValue = (key: ObjectKeyWithLiteralValue): string => {
  if (t.isIdentifier(key)) return key.name;
  else if (t.isStringLiteral(key)) return key.value;
  throw new Error(`Expected an identifier or a string literal, got type ${(key as any).type}`);
};

export const isAtRule = (key: ObjectKeyWithLiteralValue): key is ObjectKeyWithLiteralValue =>
  getKeyValue(key).startsWith('@');

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
  EMPTY_VARIANT_OBJECT = 'The variant object must not be empty.',
  DUPLICATE_AT_RULE = 'Cannot declare an at-rule more than once in CSS Map.',
  DUPLICATE_SELECTOR = 'Cannot declare a selector more than once in CSS Map.',
  DUPLICATE_SELECTORS_BLOCK = 'Duplicate `selectors` key found in cssMap; expected either zero `selectors` keys or one.',
  STATIC_PROPERTY_KEY = 'Property key may only be a static string.',
  SELECTOR_BLOCK_WRONG_PLACE = '`selector` key was defined in the wrong place.',
  USE_SELECTORS_WITH_AMPERSAND = 'This selector is applied to the current element (or the parent element), and so it should have the ampersand symbol (&) directly before it. For example, `:hover` should be written as `&:hover`.',
}

// TODO: add selectors key and @media queries to the below message
// TODO: move this to the website documentation?
// export const createErrorMessage = (message: string): string => {
//   return `
// ${message}

// The below cssMap example may be helpful:

// \`\`\`
// import { css, cssMap } from '@compiled/react';
// const borderStyleMap = cssMap({
//     none: {
//       borderStyle: 'none',
//       '@media': { 'screen and (max-width: 500px)': { font-size: 2rem; } },
//     },
//     solid: {
//       borderStyle: 'solid',
//       '@media': { 'screen and (max-width: 500px)': { font-size: 1.75rem; } },
//     },
// });
// const Component = ({ borderStyle }) => <div css={css(borderStyleMap[borderStyle])} />
// \`\`\`
//     `;
// };

export const createErrorMessage = (message: string): string => {
  return `
${message}

Check out our documentation for cssMap examples: https://compiledcssinjs.com/docs/api-cssmap
`;
};
