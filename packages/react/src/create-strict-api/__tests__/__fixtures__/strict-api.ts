import { createStrictAPI } from '../..';

const { css, XCSSProp, cssMap, cx } = createStrictAPI<{
  '&:hover': {
    color: 'var(--ds-text)';
    background: 'var(--ds-surface-hover)' | 'var(--ds-surface-sunken-hover)';
  };
  background: 'var(--ds-surface)' | 'var(--ds-surface-sunken';
  bkgrnd: 'red' | 'green';
}>();

export { css, XCSSProp, cssMap, cx };
