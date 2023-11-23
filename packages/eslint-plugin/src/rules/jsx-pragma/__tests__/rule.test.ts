import { tester } from '../../../test-utils';
import { jsxPragmaRule } from '../index';

tester.run('jsx-pragma', jsxPragmaRule, {
  valid: [
    `
      /** @jsxImportSource @compiled/react */
      <div css={{ display: 'block' }} />
    `,
    `
      <AnotherComponent className={xcss} />
    `,
    `
      <div className={anythingElse} />
    `,
    `
      /** @jsxImportSource @compiled/react */
      <div className={xcss} />
    `,
    `
      /** @jsxImportSource @compiled/react */
      <div className={innerXcss} />
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
    {
      name: "don't error when @jsxImportSource and Compiled css API are being used",
      code: `
        /** @jsxImportSource @compiled/react */
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ runtime: 'automatic' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ runtime: 'classic' }],
    },
    {
      name: "when onlyRunIfImportingCompiled is true and Compiled is not imported, don't override with Compiled",
      code: `<div css={{ display: 'block' }} />`,
      options: [{ onlyRunIfImportingCompiled: true }],
    },
    {
      name: "when onlyRunIfImportingCompiled is true and Emotion jsx is used, don't override with Compiled",
      code: `
        /** @jsx jsx */
        import { jsx } from '@emotion/react';
        <>
          <div css={{ display: 'block' }} />
          <div css={[ someStyles ]} />
        </>
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
    },
    {
      name: "when onlyRunIfImportingCompiled is true and Emotion css is used, don't override with Compiled (with Emotion css function)",
      code: `
        import { css } from '@emotion/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
    },
    {
      name: "when onlyRunIfImportingCompiled is true and Emotion css is used, don't override with Compiled (with Emotion css and jsx)",
      code: `
        /** @jsx jsx */
        import { css, jsx } from '@emotion/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
    },
  ],
  invalid: [
    {
      code: `
      <div className={xcss} />
      `,
      output: `
      /** @jsxImportSource @compiled/react */
<div className={xcss} />
      `,
      errors: [{ messageId: 'missingPragmaXCSS' }],
    },
    {
      code: `
      <div className={innerXcss} />
    `,
      output: `
      /** @jsxImportSource @compiled/react */
<div className={innerXcss} />
    `,
      errors: [{ messageId: 'missingPragmaXCSS' }],
    },
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
    {
      name: 'should error if Emotion css and Compiled styled are used',
      code: `
        import { css } from '@emotion/react';
        import { styled } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error if Emotion css and Compiled styled are used (onlyRunIfImportingCompiled = true)',
      code: `
        import { css } from '@emotion/react';
        import { styled } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error when both Emotion and Compiled css APIs are being used',
      code: `
        /** @jsx jsx */
        import * as React from 'react';
        import { css, jsx } from '@emotion/react';
        import { css as cssCompiled } from '@compiled/react';

        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error when both Emotion and Compiled css APIs are being used (alt)',
      code: `
        /** @jsx jsxEmotion */
        import * as React from 'react';
        import { css, jsx as jsxEmotion } from '@emotion/react';
        import { css as cssCompiled } from '@compiled/react';

        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error when both Emotion jsx API and Compiled css API are being used',
      code: `
        import * as React from 'react';
        import { jsx } from '@emotion/react';
        import { css } from '@compiled/react';

        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error when both Emotion jsx API and Compiled css API are being used (with JSX pragma)',
      code: `
        /** @jsx jsx */
        import * as React from 'react';
        import { jsx } from '@emotion/react';
        import { css } from '@compiled/react';

        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error when both Emotion css API and Compiled jsx API are being used (with JSX pragma)',
      code: `
        /** @jsx jsx */
        import * as React from 'react';
        import { jsx } from '@compiled/react';
        import { css } from '@emotion/react';

        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true, runtime: 'classic' }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error when both Emotion and Compiled css APIs are being used (with @emotion/core)',
      code: `
        /** @jsx jsxEmotion */
        import * as React from 'react';
        import { jsx } from '@emotion/core';
        import { css as cssCompiled } from '@compiled/react';

        <div css={{ display: 'block' }} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error when both Emotion and Compiled css APIs are being used (onlyRunIfImportingCompiled = true)',
      code: `
        import * as React from 'react';
        import { css } from '@emotion/react';
        import { css as cssCompiled } from '@compiled/react';

        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
  ],
});
