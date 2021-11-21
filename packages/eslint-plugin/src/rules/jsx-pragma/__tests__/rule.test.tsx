import type { RuleTester } from 'eslint';
import { tester } from '../../__tests__/test-utils';
import rule from '../index';

const tests: {
  valid?: (string | RuleTester.ValidTestCase)[];
  invalid?: RuleTester.InvalidTestCase[];
} = {
  valid: [
    `
      /** @jsxImportSource @compiled/react */
    `,
    `
      /** @jsx jsx */
      import { jsx } from '@compiled/react';

      <div css={{ display: 'block' }} />
    `,
    `
      /** @jsxImportSource @compiled/react */
      <div css={{ display: 'block' }} />
  `,
  ],
  invalid: [
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
};

tester.run('prefer-jsx-import-source-pragma', rule, tests);
