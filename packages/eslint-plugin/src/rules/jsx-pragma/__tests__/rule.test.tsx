import { tester } from '../../__tests__/test-utils';
import rule from '../index';

tester.run('jsx-pragma', rule, {
  valid: [
    `
      /** @jsxImportSource @compiled/react */
      <div css={{ display: 'block' }} />
    `,
    {
      code: `
      /** @jsxImportSource @compiled/react */
      <div css={{ display: 'block' }} />
    `,
      options: [{ pragma: 'jsxImportSource' }],
    },
    {
      code: `
      /** @jsx jsx */
      import { jsx } from '@compiled/react';
      <div css={{ display: 'block' }} />
    `,
      options: [{ pragma: 'jsx' }],
    },
  ],
  invalid: [
    {
      code: `<div css={{ display: 'block' }} />`,
      output: `/** @jsx jsx */
import { jsx } from '@compiled/react';
<div css={{ display: 'block' }} />`,
      options: [{ pragma: 'jsx' }],
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
      output: `
        /** @jsx jsx */
        import { jsx } from '@compiled/react';
<div css={{ display: 'block' }} />
      `,
      options: [{ pragma: 'jsx' }],
      errors: [
        {
          messageId: 'preferJsx',
        },
      ],
    },
    {
      code: `
        /** @jsxImportSource @compiled/react */
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      output: `
        /** @jsx jsx */
        import { css, jsx } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ pragma: 'jsx' }],
      errors: [
        {
          messageId: 'preferJsx',
        },
      ],
    },
    {
      code: `
import '@compiled/react';
<Fragment>
  <div css={{ display: 'block' }} />
  <div css={{ display: 'block' }} />
</Fragment>`,
      output: `
/** @jsx jsx */
import { jsx } from '@compiled/react';
<Fragment>
  <div css={{ display: 'block' }} />
  <div css={{ display: 'block' }} />
</Fragment>`,
      options: [{ pragma: 'jsx' }],
      errors: [
        {
          message: 'The jsx pragma is missing.',
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
      code: `
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      output: `
        /** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          message: 'The jsxImportSource pragma is missing.',
        },
      ],
    },
    {
      code: `/** @jsx jsx */ import { jsx } from '@compiled/react';<div css={{ display: 'block' }} />`,
      output: `/** @jsxImportSource @compiled/react */ <div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      code: `/** @jsx jsx */ import { jsx, styled } from '@compiled/react';<div css={{ display: 'block' }} />`,
      output: `/** @jsxImportSource @compiled/react */ import { styled } from '@compiled/react';<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      code: `/** @jsx jsx */ import { jsx, styled as styl } from '@compiled/react';<div css={{ display: 'block' }} />`,
      output: `/** @jsxImportSource @compiled/react */ import { styled as styl } from '@compiled/react';<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
  ],
});
