import { toHaveCompiledCss } from '@compiled/jest-css-in-js';

// @ts-ignore
window.__style_nonce__ = 'noncey';

expect.extend({
  toHaveCompiledCss,
});
