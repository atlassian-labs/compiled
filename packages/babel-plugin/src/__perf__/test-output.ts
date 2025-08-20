import { join } from 'path';

import { transform as transformCode } from '../test-utils';

const code = `
      import { cssMap, j } from '@compiled/react';

      const styles = cssMap({
        primary: { color: 'red' },
        secondary: { color: 'blue' }
      });

      <Component xcss={j(isPrimary && styles.primary, !isPrimary && styles.secondary)} />
`;

const transform = (options = {}) =>
  transformCode(code, {
    cache: false,
    filename: join(__dirname, 'module-traversal-cache.js'),
    ...options,
  });

console.log(transform({}));
