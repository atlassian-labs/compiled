/* eslint-disable prefer-const */
import type { CompiledAPI } from '../../index';
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

let css: CompiledAPI<API>['css'];
let cssMap: CompiledAPI<API>['cssMap'];
let cx: CompiledAPI<API>['cx'];
let XCSSProp: CompiledAPI<API>['XCSSProp'];

({ css, XCSSProp, cssMap, cx } = createStrictAPI<API>());

export { css, XCSSProp, cssMap, cx };
