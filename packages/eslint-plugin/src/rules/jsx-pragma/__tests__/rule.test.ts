import { tester } from '../../../test-utils';
import { jsxPragmaRule } from '../index';

tester.run('jsx-pragma', jsxPragmaRule, {
  valid: [
    {
      name: 'should be valid if automatic jsx pragma is used',
      code: `
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
    },
    {
      name: 'should be valid if using xcss on a React component',
      code: `
        <AnotherComponent className={xcss} />
      `,
    },
    {
      name: 'should be valid if not using xcss on a JSX element',
      code: `
        <div className={anythingElse} />
      `,
    },
    {
      name: 'should be valid if using xcss on a JSX element with automatic jsx pragma',
      code: `
        /** @jsxImportSource @compiled/react */
        <div className={xcss} />
      `,
    },
    {
      name: 'should be valid if using xcss under a different name with automatic jsx pragma',
      code: `
        /** @jsxImportSource @compiled/react */
        <div className={innerXcss} />
      `,
    },
    {
      name: 'should be valid if runtime = automatic and automatic jsx pragma is used',
      code: `
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
      options: [{ runtime: 'automatic' }],
    },
    {
      name: 'should be valid if runtime = classic and classic jsx pragma is used',
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
      name: 'should be valid if runtime = classic and classic jsx pragma is used with css function call',
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
      name: 'should error if pragma missing when using xcss on JSX element',
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
      name: 'should error if pragma missing when using xcss under different name',
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
      name: 'should add jsx pragma and Compiled import if neither are there',
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
      name: 'should replace automatic jsx pragma with classic pragma, if runtime = classic',
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
      name: 'should replace automatic jsx pragma with classic pragma, if runtime = classic (with css function call)',
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
      name: 'should replace automatic jsx pragma with classic pragma, if runtime = classic',
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
        // check the raw message, not the messageId, to ensure that this
        // says "jsx pragma" and not "jsxImportSource pragma"
        {
          message: 'To use the `css` prop you must set the jsx pragma.',
        },
        {
          message: 'To use the `css` prop you must set the jsx pragma.',
        },
      ],
    },
    {
      name: 'should add automatic jsx pragma if not specified',
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
      name: 'should add automatic jsx pragma if css function call is used',
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
        // check the raw message, not the messageId, to ensure that this
        // says "jsxImportSource pragma" and not "jsx pragma"
        {
          message: 'To use the `css` prop you must set the jsx pragma.',
        },
      ],
    },
    {
      name: 'should add classic jsx pragma if css function call is used',
      code: `/** @jsx jsx */ import { jsx } from '@compiled/react';<div css={{ display: 'block' }} />`,
      output: `/** @jsxImportSource @compiled/react */ <div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      name: 'should keep other Compiled imports intact when fixing',
      code: `/** @jsx jsx */ import { jsx, styled } from '@compiled/react';<div css={{ display: 'block' }} />`,
      output: `/** @jsxImportSource @compiled/react */ import { styled } from '@compiled/react';<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      name: 'should keep other, renamed Compiled imports intact when fixing',
      code: `/** @jsx jsx */ import { jsx, styled as styl } from '@compiled/react';<div css={{ display: 'block' }} />`,
      output: `/** @jsxImportSource @compiled/react */ import { styled as styl } from '@compiled/react';<div css={{ display: 'block' }} />`,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      name: 'should remove React default import',
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
      name: 'should keep React import if React is used',
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
      name: 'should remove React default import if other React imports are imported separately',
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
      name: 'should keep React import if no React default imports present',
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
      name: 'should keep React namespace import if used in file',
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
      name: 'should remove React namespace import',
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
    {
      name: 'should error if Emotion css and Compiled styled are used (with importSources)',
      code: `
        import { css } from '@emotion/react';
        import { styled } from '@atlaskit/css';
        <div css={css({ display: 'block' })} />
      `,
      options: [
        {
          importSources: ['@atlaskit/css'],
          onlyRunIfImportingCompiled: true,
        },
      ],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should consider libraries in importSources to be Compiled imports',
      code: `
        import { css } from '@atlaskit/css';

        const styles = css({ display: 'block' });
        <div css={styles} />
      `,
      output: `
        /** @jsxImportSource @compiled/react */
import { css } from '@atlaskit/css';

        const styles = css({ display: 'block' });
        <div css={styles} />
      `,
      options: [
        {
          importSources: ['@atlaskit/css'],
          onlyRunIfImportingCompiled: true,
        },
      ],
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
  ],
});
