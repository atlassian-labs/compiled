// We can't reference the module here as it won't get picked up by ts-node/tsconfig-paths.
// Instead we reference it directly - happy days!
import { toHaveCompiledCss } from '../packages/jest/src';

expect.extend({
  toHaveCompiledCss,
});

// Used to override pkg version in tests so it is stable across version changes.
process.env.TEST_PKG_VERSION = '0.0.0';
