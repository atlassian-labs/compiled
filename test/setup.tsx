import { toHaveCompiledCss } from '@compiled/jest';

expect.extend({
  toHaveCompiledCss,
});

// Used to override pkg version in tests so it is stable across version changes.
process.env.TEST_PKG_VERSION = '0.0.0';
