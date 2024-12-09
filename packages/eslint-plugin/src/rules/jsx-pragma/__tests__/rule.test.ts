import { outdent } from 'outdent';

import { tester } from '../../../test-utils';
import { jsxPragmaRule } from '../index';

tester.run('jsx-pragma', jsxPragmaRule, {
  valid: [
    {
      name: 'should be valid if automatic jsx pragma is used',
      code: outdent`
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
    },
    {
      name: 'should be valid if automatic jsx pragma is with a Compiled import',
      code: outdent`
        /** @jsxImportSource @compiled/react */
        import { css, jsx } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
    },
    {
      name: 'should be valid if using xcss on a React component',
      code: outdent`
        <AnotherComponent className={xcss} />
      `,
    },
    {
      name: 'should be valid if not using xcss on a JSX element',
      code: outdent`
        <div className={anythingElse} />
      `,
    },
    {
      name: 'should be valid if using xcss on a JSX element with automatic jsx pragma',
      code: outdent`
        /** @jsxImportSource @compiled/react */
        <div className={xcss} />
      `,
    },
    {
      name: 'should be valid if using xcss under a different name with automatic jsx pragma',
      code: outdent`
        /** @jsxImportSource @compiled/react */
        <div className={innerXcss} />
      `,
    },
    {
      name: 'should be valid if runtime = automatic and automatic jsx pragma is used',
      code: outdent`
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
      options: [{ runtime: 'automatic' }],
    },
    {
      name: 'should be valid if runtime = classic and classic jsx pragma is used',
      code: outdent`
        /** @jsx jsx */
        import { jsx } from '@compiled/react';
        <div css={{ display: 'block' }} />
      `,
      options: [{ runtime: 'classic' }],
    },
    {
      name: "don't error when @jsxImportSource and Compiled css API are being used",
      code: outdent`
        /** @jsxImportSource @compiled/react */
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ runtime: 'automatic' }],
    },
    {
      name: 'should be valid if runtime = classic and classic jsx pragma is used with css function call',
      code: outdent`
        /** @jsx jsx */
        import { css, jsx } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ runtime: 'classic' }],
    },
    {
      name: 'should be valid if runtime = classic and classic jsx pragma is used with css function call for @atlaskit/css',
      code: outdent`
        /** @jsx jsx */
        import { css, jsx } from '@atlaskit/css';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ runtime: 'classic' }],
    },
    {
      name: 'should be valid if runtime = classic and classic jsx pragma is used with css function call found in importSources',
      code: outdent`
        /** @jsx jsx */
        import { css, jsx } from '@other/css';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ runtime: 'classic', importSources: ['@other/css'] }],
    },
    {
      name: "when onlyRunIfImportingCompiled is true and Compiled is not imported, don't override with Compiled",
      code: outdent`<div css={{ display: 'block' }} />`,
      options: [{ onlyRunIfImportingCompiled: true }],
    },
    {
      name: "when onlyRunIfImportingCompiled is true and Emotion jsx is used, don't override with Compiled",
      code: outdent`
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
      code: outdent`
        import { css } from '@emotion/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
    },
    {
      name: "when onlyRunIfImportingCompiled is true and Emotion css is used, don't override with Compiled (with Emotion css and jsx)",
      code: outdent`
        /** @jsx jsx */
        import { css, jsx } from '@emotion/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
    },
    {
      name: 'jsxImportSource should be valid when using an available import source',
      code: outdent`
        /** @jsxImportSource @other/css */
        import { css } from '@other/css';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ importSources: ['@other/css'] }],
    },
    {
      name: "jsxImportSource shouldn't using an import source that isn't imported",
      code: outdent`
        /** @jsxImportSource @other/css */
        <div css={css({ display: 'block' })} />
      `,
      options: [{ importSources: ['@other/css'] }],
    },
    {
      name: 'jsxImportSource should be valid with @compiled/react by default',
      code: outdent`
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
    },
    {
      name: 'jsxImportSource should be valid with @atlaskit/css by default',
      code: outdent`
        /** @jsxImportSource @atlaskit/css */
        <div css={{ display: 'block' }} />
      `,
    },
    {
      name: 'when importSources is non-empty, onlyRunIfImportingCompiled should automatically be set to true',
      // If we get an error here, then onlyRunIfImportingCompiled was not set to true.
      code: outdent`
        /** @jsx jsx */
        import { css, jsx } from '@emotion/react';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ importSources: ['@other/css'] }],
    },
    {
      name: 'should not add jsx pragma or Compiled import if neither are there with importSources (sets onlyRunIfImportingCompiled=true)',
      code: outdent`<div css={{ display: 'block' }} />`,
      options: [{ runtime: 'classic', importSources: ['@other/css'] }],
    },
  ],
  invalid: [
    {
      name: 'should error if pragma missing when using xcss on JSX element',
      code: outdent`
        <div className={xcss} />
      `,
      output: outdent`
        /** @jsxImportSource @compiled/react */
        <div className={xcss} />
      `,
      errors: [{ messageId: 'missingPragmaXCSS' }],
    },
    {
      name: 'should error if pragma missing when using xcss under different name',
      code: outdent`
        <div className={innerXcss} />
      `,
      output: outdent`
        /** @jsxImportSource @compiled/react */
        <div className={innerXcss} />
      `,
      errors: [{ messageId: 'missingPragmaXCSS' }],
    },
    {
      name: 'should add jsx pragma and Compiled import if neither are there',
      code: outdent`
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
        /** @jsx jsx */
        import { jsx } from '@compiled/react';
        <div css={{ display: 'block' }} />
      `,
      options: [{ runtime: 'classic' }],
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      name: 'should add jsx pragma and Compiled import if neither are there with importSources and onlyRunIfImportingCompiled=false',
      code: outdent`
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
        /** @jsx jsx */
        import { jsx } from '@compiled/react';
        <div css={{ display: 'block' }} />
      `,
      options: [
        { runtime: 'classic', importSources: ['@other/css'], onlyRunIfImportingCompiled: false },
      ],
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      name: 'should replace automatic jsx pragma with classic pragma, if runtime = classic',
      code: outdent`
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
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
      name: 'should replace automatic jsx pragma with classic pragma using @atlaskit/css, if runtime = classic',
      code: outdent`
        /** @jsxImportSource @atlaskit/css */
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
        /** @jsx jsx */
        import { jsx } from '@atlaskit/css';
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
      name: 'should replace automatic jsx pragma with classic pragma using the importSource, if runtime = classic',
      code: outdent`
        /** @jsxImportSource @other/css */
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
        /** @jsx jsx */
        import { jsx } from '@other/css';
        <div css={{ display: 'block' }} />
      `,
      options: [{ runtime: 'classic', importSources: ['@other/css'] }],
      errors: [
        {
          messageId: 'preferJsx',
        },
      ],
    },
    {
      name: 'should replace automatic jsx pragma with classic pragma, if runtime = classic (with css function call)',
      code: outdent`
        /** @jsxImportSource @compiled/react */
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
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
      name: 'should replace automatic jsx pragma with classic pragma, if runtime = classic (with css function call) using @atlaskit/css',
      code: outdent`
        /** @jsxImportSource @atlaskit/css */
        import { css } from '@atlaskit/css';
        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
        /** @jsx jsx */
        import { css, jsx } from '@atlaskit/css';
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
      name: 'should replace automatic jsx pragma with classic pragma, if runtime = classic (with css function call) using an importSource',
      code: outdent`
        /** @jsxImportSource @other/css */
        import { css } from '@other/css';
        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
        /** @jsx jsx */
        import { css, jsx } from '@other/css';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ runtime: 'classic', importSources: ['@other/css'] }],
      errors: [
        {
          messageId: 'preferJsx',
        },
      ],
    },
    {
      name: 'should replace automatic jsx pragma with classic pragma, if runtime = classic',
      code: outdent`
        import '@compiled/react';
        <Fragment>
          <div css={{ display: 'block' }} />
          <div css={{ display: 'block' }} />
        </Fragment>`,
      output: outdent`
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
      code: outdent`
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
        /** @jsxImportSource @compiled/react */
        <div css={{ display: 'block' }} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      name: 'should add automatic jsx pragma if css function call is used',
      code: outdent`
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
        /** @jsxImportSource @compiled/react */
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      errors: [
        // check the raw message, not the messageId, to ensure that this
        // says "jsxImportSource pragma" and not "jsx pragma"
        {
          message: 'To use the `css` prop you must set the jsxImportSource pragma.',
        },
      ],
    },
    {
      name: 'should add automatic jsx pragma if css function call is used using @atlaskit/css',
      code: outdent`
        import { css } from '@atlaskit/css';
        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
        /** @jsxImportSource @atlaskit/css */
        import { css } from '@atlaskit/css';
        <div css={css({ display: 'block' })} />
      `,
      errors: [
        // check the raw message, not the messageId, to ensure that this
        // says "jsxImportSource pragma" and not "jsx pragma"
        {
          message: 'To use the `css` prop you must set the jsxImportSource pragma.',
        },
      ],
    },
    {
      name: 'should add automatic jsx pragma if css function call is used using the importSource',
      code: outdent`
        import { css } from '@other/css';
        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
        /** @jsxImportSource @other/css */
        import { css } from '@other/css';
        <div css={css({ display: 'block' })} />
      `,
      options: [{ importSources: ['@other/css'] }],
      errors: [
        // check the raw message, not the messageId, to ensure that this
        // says "jsxImportSource pragma" and not "jsx pragma"
        {
          message: 'To use the `css` prop you must set the jsxImportSource pragma.',
        },
      ],
    },
    {
      name: 'should add automatic jsx pragma by default',
      code: outdent`
        /** @jsx jsx */
        import { jsx } from '@compiled/react';
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
        /** @jsxImportSource @compiled/react */

        <div css={{ display: 'block' }} />
      `,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      name: 'should keep other Compiled imports intact when fixing',
      code: outdent`
        /** @jsx jsx */
        import { jsx, styled } from '@compiled/react';
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
        /** @jsxImportSource @compiled/react */
        import { styled } from '@compiled/react';
        <div css={{ display: 'block' }} />
      `,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      name: 'should keep other, renamed Compiled imports intact when fixing',
      code: outdent`
        /** @jsx jsx */
        import { jsx, styled as styl } from '@compiled/react';
        <div css={{ display: 'block' }} />
      `,
      output: outdent`
        /** @jsxImportSource @compiled/react */
        import { styled as styl } from '@compiled/react';
        <div css={{ display: 'block' }} />
      `,
      errors: [
        {
          messageId: 'preferJsxImportSource',
        },
      ],
    },
    {
      name: 'should remove React default import',
      code: outdent`
        import React from 'react';
        import { css } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
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
      code: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        React.useState();

        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
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
      code: outdent`
        import React, { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
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
      code: outdent`
        import { useState } from 'react';
        import { css } from '@compiled/react';

        useState();

        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
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
      code: outdent`
        import * as React from 'react';
        import { css } from '@compiled/react';

        React.useState();

        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
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
      code: outdent`
        import * as React from 'react';
        import { css } from '@compiled/react';

        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
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
      code: outdent`
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
      code: outdent`
        import { css } from '@emotion/react';
        import { styled } from '@compiled/react';
        <div css={css({ display: 'block' })} />
      `,
      // Just testing to make sure importSources doesn't do anything weird either…
      options: [{ onlyRunIfImportingCompiled: true, importSources: ['@emotion/react'] }],
      errors: [
        {
          messageId: 'emotionAndCompiledConflict',
        },
      ],
    },
    {
      name: 'should error when both Emotion and Compiled css APIs are being used',
      code: outdent`
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
      code: outdent`
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
      code: outdent`
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
      code: outdent`
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
      code: outdent`
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
      code: outdent`
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
      code: outdent`
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
      name: 'should error if Emotion css and Compiled styled are used (with @atlaskit/css)',
      code: outdent`
        import { css } from '@emotion/react';
        import { styled } from '@atlaskit/css';
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
      code: outdent`
        import { css } from '@emotion/react';
        import { styled } from '@other/css';
        <div css={css({ display: 'block' })} />
      `,
      options: [
        {
          importSources: ['@other/css'],
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
      name: 'should consider @atlaskit/css to be Compiled imports by default',
      code: outdent`
        import { css } from '@atlaskit/css';

        const styles = css({ display: 'block' });
        <div css={styles} />
      `,
      output: outdent`
        /** @jsxImportSource @atlaskit/css */
        import { css } from '@atlaskit/css';

        const styles = css({ display: 'block' });
        <div css={styles} />
      `,
      options: [{ onlyRunIfImportingCompiled: true }],
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      name: 'should consider libraries in importSources to be Compiled imports',
      code: outdent`
        import { css } from '@other/css';

        const styles = css({ display: 'block' });
        <div css={styles} />
      `,
      output: outdent`
        /** @jsxImportSource @other/css */
        import { css } from '@other/css';

        const styles = css({ display: 'block' });
        <div css={styles} />
      `,
      options: [
        {
          importSources: ['@other/css'],
          onlyRunIfImportingCompiled: true,
        },
      ],
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
    },
    {
      name: 'when importSources is empty, onlyRunIfImportingCompiled should not automatically be set to true',
      code: outdent`
        import { css } from '@emotion/react';
        <div css={css({ display: 'block' })} />
      `,
      output: outdent`
        /** @jsxImportSource @compiled/react */
        import { css } from '@emotion/react';
        <div css={css({ display: 'block' })} />
      `,
      errors: [
        {
          messageId: 'missingPragma',
        },
      ],
      options: [{ importSources: [] }],
    },
  ],
});
