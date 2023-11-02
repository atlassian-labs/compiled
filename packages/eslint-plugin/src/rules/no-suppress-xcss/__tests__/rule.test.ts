import { typeScriptTester as tester } from '../../../test-utils';
import { noSuppressXCSS } from '../index';

tester.run('no-styled-tagged-template-expression', noSuppressXCSS, {
  valid: [
    `
      <Component xcss={{ fill: 'red' }} />
    `,
    `
      <Component innerXcss={{ fill: 'red' }} />
    `,
    `
      // @ts-expect-error
      function Foo() {
        // @ts-ignore
        return (
          <>
            <Component xcss={{ fill: 'red' }} />
          </>
        );
      }
    `,
  ],
  invalid: [
    {
      code: `
      <Component
        xcss={{
          // @ts-expect-error
          fill: 'red'
        }}
      />
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
    {
      code: `
      // @ts-expect-error
      <Component xcss={{ fill: 'red' }} />
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
    {
      code: `
      // @ts-expect-error
      <Component innerXcss={{ fill: 'red' }} />
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
    {
      code: `
      // @ts-ignore
      <Component xcss={{ fill: 'red' }} />
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
    {
      code: `

      <Component
        // @ts-expect-error
        innerXcss={{ fill: 'red' }}
      />
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
    {
      code: `

      <Component
        // @ts-ignore
        xcss={{ fill: 'red' }}
      />
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
    {
      code: `
      // @ts-ignore
      <Component innerXcss={{ fill: 'red' }} />
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
    {
      code: `
      function Foo() {
        return (
          <>
            {/* @ts-ignore */}
            <Component xcss={{ fill: 'red' }} />
          </>
        );
      }
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
    {
      code: `
      function Foo() {
        return (
          <>
            {/* @ts-expect-error */}
            <Component xcss={{ fill: 'red' }} />
          </>
        );
      }
    `,
      errors: [{ messageId: 'no-suppress-xcss' }],
    },
  ],
});
