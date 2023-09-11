import type * as t from '@babel/types';

export const EXTENDED_SELECTORS_KEY = 'selectors';

type ObjectKeyWithLiteralValue = t.Identifier | t.StringLiteral;

export const objectKeyIsLiteralValue = (
  key: t.ObjectProperty['key']
): key is ObjectKeyWithLiteralValue => key.type === 'Identifier' || key.type === 'StringLiteral';

export const getKeyValue = (key: ObjectKeyWithLiteralValue): string => {
  if (key.type === 'Identifier') return key.name;
  else if (key.type === 'StringLiteral') return key.value;
  throw new Error(`Expected an identifier or a string literal, got type ${(key as any).type}`);
};

export const isAtRule = (key: ObjectKeyWithLiteralValue): boolean =>
  getKeyValue(key).startsWith('@');

export const hasExtendedSelectorsKey = (property: t.ObjectProperty): boolean =>
  objectKeyIsLiteralValue(property.key) && getKeyValue(property.key) === EXTENDED_SELECTORS_KEY;

// The messages are exported for testing.
export enum ErrorMessages {
  NO_TAGGED_TEMPLATE = 'cssMap function cannot be used as a tagged template expression.',
  NUMBER_OF_ARGUMENT = 'cssMap function can only receive one argument.',
  ARGUMENT_TYPE = 'cssMap function can only receive an object.',
  DEFINE_MAP = 'CSS Map must be declared at the top-most scope of the module.',
  NO_SPREAD_ELEMENT = 'Spread element is not supported in CSS Map.',
  NO_OBJECT_METHOD = 'Object method is not supported in CSS Map.',
  STATIC_VARIANT_OBJECT = 'The variant object must be statically defined.',
}

export const createErrorMessage = (message: string): string => {
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
