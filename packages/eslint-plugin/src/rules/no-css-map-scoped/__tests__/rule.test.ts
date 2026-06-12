import { RuleTester } from 'eslint';

import { noCssMapScopedRule as rule } from '../index.js';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run('no-css-map-scoped', rule, {
  valid: [
    // cssMap is allowed — not cssMapScoped
    {
      code: `
        import { cssMap } from '@compiled/react';
        const styles = cssMap({ danger: { color: 'red' } });
      `,
    },
    // cssMapScoped from an unrelated import is allowed
    {
      code: `
        import { cssMapScoped } from 'some-other-lib';
        const styles = cssMapScoped({ danger: { color: 'red' } });
      `,
    },
    // unrelated function calls are allowed
    {
      code: `
        import { css } from '@compiled/react';
        const styles = css({ color: 'red' });
      `,
    },
  ],
  invalid: [
    // cssMapScoped from @compiled/react is flagged
    {
      code: `
        import { cssMapScoped } from '@compiled/react';
        const styles = cssMapScoped({ danger: { color: 'red' } });
      `,
      errors: [{ messageId: 'noCssMapScoped' }],
    },
    // cssMapScoped from @atlaskit/css is also flagged
    {
      code: `
        import { cssMapScoped } from '@atlaskit/css';
        const styles = cssMapScoped({ danger: { color: 'red' } });
      `,
      errors: [{ messageId: 'noCssMapScoped' }],
    },
    // multiple cssMapScoped calls — each is flagged
    {
      code: `
        import { cssMapScoped } from '@compiled/react';
        const stylesA = cssMapScoped({ base: { color: 'blue' } });
        const stylesB = cssMapScoped({ danger: { color: 'red' } });
      `,
      errors: [{ messageId: 'noCssMapScoped' }, { messageId: 'noCssMapScoped' }],
    },
  ],
});
