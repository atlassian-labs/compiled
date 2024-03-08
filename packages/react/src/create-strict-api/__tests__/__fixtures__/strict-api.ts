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

type CustomMediaQueries = 'screen and (min-width: 40em)' | '(min-width: 100rem)';

const { css, XCSSProp, cssMap, cx } = createStrictAPI<CSSPropertiesSchema, CustomMediaQueries>();

export { css, XCSSProp, cssMap, cx };
