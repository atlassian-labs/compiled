import { typeScriptTester as tester } from '../../../test-utils';
import { noSuppressXCSS } from '../index';

tester.run('no-styled-tagged-template-expression', noSuppressXCSS, {
  valid: [
    {
      filename: 'my-component.tsx',
      code: `
      <Component xcss={{ fill: 'red' }} />
    `,
    },
  ],
  invalid: [
    {
      filename: 'my-component.js',
      code: `
      <Component xcss={{ fill: 'red' }} />
    `,
      errors: [{ messageId: 'no-js-xcss' }],
    },
    {
      filename: 'my-component.jsx',
      code: `
      <Component xcss={{ fill: 'red' }} />
    `,
      errors: [{ messageId: 'no-js-xcss' }],
    },
  ],
});
