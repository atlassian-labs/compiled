import { tester } from '../../__tests__/test-utils';
import rule from '../index';

tester.run('jsx-pragma', rule, {
  valid: [
    `
      /** @jsxImportSource @compiled/react */
    `,
    {
      code: `
      /** @jsx jsx */
      import { jsx } from '@compiled/react';

      <div css={{ display: 'block' }} />
    `,
      options: [{ pragma: 'jsx' }],
    },
    `
      /** @jsxImportSource @compiled/react */
      <div css={{ display: 'block' }} />
  `,
  ],
  invalid: [
    {
      code: `<div css={{ display: 'block' }} />`,
      output: `/** @jsx jsx */
<div css={{ display: 'block' }} />`,
      options: [{ pragma: 'jsx' }],
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `<div css={{ display: 'block' }} />`,
      output: `/** @jsxImportSource @compiled/react */
<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `/** @jsx jsx */ import { jsx } from '@compiled/react';`,
      output: `/** @jsxImportSource @compiled/react */ `,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      code: `/** @jsx jsx */ import { jsx, styled } from '@compiled/react';`,
      output: `/** @jsxImportSource @compiled/react */ import { styled } from '@compiled/react';`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      code: `/** @jsx jsx */ import { jsx, styled as styl } from '@compiled/react';`,
      output: `/** @jsxImportSource @compiled/react */ import { styled as styl } from '@compiled/react';`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
  ],
});
