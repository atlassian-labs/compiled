import { tester } from '../../__tests__/test-utils';
import rule from '../index';

tester.run('jsx-pragma', rule, {
  invalid: [
    {
      code: `<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
      options: [{ runtime: 'classic' }],
      output: `/** @jsx jsx */
import { jsx } from '@compiled/react';
<div css={{ display: 'block' }} />`,
    },
    {
      code: `
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
      errors: [
        {
          messageId: 'preferJsx',
        },
      ],
      options: [{ runtime: 'classic' }],
      output: `
        /** @jsx jsx */
        import { jsx } from '@compiled/react';
<div css={{ display: 'block' }} />
      `,
    },
    {
      code: `
        /** @jsxImportSource @compiled/react */
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'preferJsx',
        },
      ],
      options: [{ runtime: 'classic' }],
      output: `
        /** @jsx jsx */
        import { css, jsx } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
    },
    {
      code: `
        import '@compiled/react';
        <Fragment>
          <div css={{ display: 'block' }} />
          <div css={{ display: 'block' }} />
        </Fragment>`,
      errors: [
        {
          message: 'To use the `css` prop you must set the jsx pragma.',
        },
        {
          message: 'To use the `css` prop you must set the jsx pragma.',
        },
      ],
      options: [{ runtime: 'classic' }],
      output: `
        /** @jsx jsx */
import { jsx } from '@compiled/react';
        <Fragment>
          <div css={{ display: 'block' }} />
          <div css={{ display: 'block' }} />
        </Fragment>`,
    },
    {
      code: `<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
      output: `/** @jsxImportSource @compiled/react */
<div css={{ display: 'block' }} />`,
    },
    {
      code: `
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          message: 'To use the `css` prop you must set the jsxImportSource pragma.',
        },
      ],
      output: `
        /** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
    },
    {
      code: `/** @jsx jsx */ import { jsx } from '@compiled/react';<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
      output: `/** @jsxImportSource @compiled/react */ <div css={{ display: 'block' }} />`,
    },
    {
      code: `/** @jsx jsx */ import { jsx, styled } from '@compiled/react';<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
      output: `/** @jsxImportSource @compiled/react */ import { styled } from '@compiled/react';<div css={{ display: 'block' }} />`,
    },
    {
      code: `/** @jsx jsx */ import { jsx, styled as styl } from '@compiled/react';<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
      output: `/** @jsxImportSource @compiled/react */ import { styled as styl } from '@compiled/react';<div css={{ display: 'block' }} />`,
    },
    {
      code: `
        import React from 'react';
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
      output: `
        /** @jsxImportSource @compiled/react */

        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
    },
    {
      code: `
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
      output: `
        /** @jsxImportSource @compiled/react */
import React from 'react';
        import { css } from '@compiled/react';

        React.useState();

        <div css={css({ display: 'block' })} />
      `,
    },
    {
      code: `
        import React, { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
      output: `
        /** @jsxImportSource @compiled/react */
import { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
    },
    {
      code: `
        import React,{useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
      output: `
        /** @jsxImportSource @compiled/react */
import { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
    },
    {
      code: `
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
      output: `
        /** @jsxImportSource @compiled/react */
import { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
    },
    {
      code: `
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
      output: `
        /** @jsxImportSource @compiled/react */
import * as React from 'react';
        import { css } from '@compiled/react';

        React.useState();

        <div css={css({ display: 'block' })} />
      `,
    },
    {
      code: `
        import * as React from 'react';
        import { css } from '@compiled/react';

        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
      output: `
        /** @jsxImportSource @compiled/react */

        import { css } from '@compiled/react';

        <div css={css({ display: 'block' })} />
      `,
    },
  ],
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
});
