import { createStrictAPI } from '../../index';

export interface CompiledStrictAPI {
  '&:hover': {
    color: 'var(--ds-text-hover)';
    background: 'var(--ds-surface-hover)' | 'var(--ds-surface-sunken-hover)';
  };
  color: 'var(--ds-text)';
  background: 'var(--ds-surface)' | 'var(--ds-surface-sunken)';
  bkgrnd: 'red' | 'green';
}

const { css, XCSSProp, cssMap, cx } = createStrictAPI<CompiledStrictAPI>();

export { css, XCSSProp, cssMap, cx };
