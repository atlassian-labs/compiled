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

const { css, XCSSProp, cssMap, cx } = createStrictAPI<CSSPropertiesSchema>();

export { css, XCSSProp, cssMap, cx };
