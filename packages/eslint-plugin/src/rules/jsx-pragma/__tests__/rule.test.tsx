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
      options: [{ runtime: 'automatic' }],
    },
    {
      code: `
      /** @jsx jsx */
      import { jsx } from '@compiled/react';
      <div css={{ display: 'block' }} />
    `,
      options: [{ runtime: 'classic' }],
    },
  ],
  invalid: [
    {
      code: `<div css={{ display: 'block' }} />`,
      output: `/** @jsx jsx */
import { jsx } from '@compiled/react';
<div css={{ display: 'block' }} />`,
      options: [{ runtime: 'classic' }],
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
      options: [{ runtime: 'classic' }],
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
      options: [{ runtime: 'classic' }],
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
      options: [{ runtime: 'classic' }],
      errors: [
        {
          message: 'To use the `css` prop you must set the jsx pragma.',
        },
        {
          message: 'To use the `css` prop you must set the jsx pragma.',
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
          message: 'To use the `css` prop you must set the jsxImportSource pragma.',
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
    {
      code: `
        import React from 'react';
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
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `
        import React from 'react';
        import { css } from '@compiled/react';

        React.useState();

        <div css={css({ display: 'block' })} />
      `,
      output: `
        /** @jsxImportSource @compiled/react */
import React from 'react';
        import { css } from '@compiled/react';

        React.useState();

        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `
        import React, { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      output: `
        /** @jsxImportSource @compiled/react */
import { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `
        import React,{useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      output: `
        /** @jsxImportSource @compiled/react */
import { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `
        import { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      output: `
        /** @jsxImportSource @compiled/react */
import { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `
        import * as React from 'react';
        import { css } from '@compiled/react';

        React.useState();

        <div css={css({ display: 'block' })} />
      `,
      output: `
        /** @jsxImportSource @compiled/react */
import * as React from 'react';
        import { css } from '@compiled/react';

        React.useState();

        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      code: `
        import * as React from 'react';
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
          messageId: 'missingPragma',
        },
      ],
    },
  ],
});
