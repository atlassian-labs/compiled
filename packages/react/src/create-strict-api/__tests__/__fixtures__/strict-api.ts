import { createStrictAPI } from '../../index';

interface API {
  '&:hover': {
    color: 'var(--ds-text-hover)';
    background: 'var(--ds-surface-hover)' | 'var(--ds-surface-sunken-hover)';
  };
  color: 'var(--ds-text)';
  background: 'var(--ds-surface)' | 'var(--ds-surface-sunken)';
  bkgrnd: 'red' | 'green';
}

const { css, XCSSProp, cssMap, cx } = createStrictAPI<API>();

export { css, XCSSProp, cssMap, cx };
