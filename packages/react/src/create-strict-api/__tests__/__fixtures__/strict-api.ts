import { createStrictAPI } from '@compiled/react';

const { css, XCSSProp, cssMap, cx } = createStrictAPI<{
  '&:hover': {
    color: 'var(--ds-text-hover)';
    background: 'var(--ds-surface-hover)' | 'var(--ds-surface-sunken-hover)';
  };
  color: 'var(--ds-text)';
  background: 'var(--ds-surface)' | 'var(--ds-surface-sunken)';
  bkgrnd: 'red' | 'green';
}>();

export { css, XCSSProp, cssMap, cx };
