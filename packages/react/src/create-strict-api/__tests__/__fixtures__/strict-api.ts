import { createStrictAPI } from '../../index';

interface CSSPropertiesSchema {
  '&:hover': {
    color: 'var(--ds-text-hover)';
    background: 'var(--ds-surface-hover)' | 'var(--ds-surface-sunken-hover)';
  };
  color: 'var(--ds-text)' | 'var(--ds-text-bold)';
  background: 'var(--ds-surface)' | 'var(--ds-surface-sunken)';
  bkgrnd: 'red' | 'green';
}

type MediaQuery =
  | '(min-width: 30rem)'
  | '(min-width: 48rem)'
  | '(min-width: 64rem)'
  | '(min-width: 90rem)'
  | '(min-width: 110rem)'
  | '(prefers-color-scheme: dark)'
  | '(prefers-color-scheme: light)';

const { css, XCSSProp, cssMap, cx } = createStrictAPI<CSSPropertiesSchema, { media: MediaQuery }>();

export { css, XCSSProp, cssMap, cx };
