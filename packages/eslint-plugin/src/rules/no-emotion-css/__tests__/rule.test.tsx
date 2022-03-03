import type { RuleTester } from 'eslint';

import { tester } from '../../__tests__/test-utils';
import rule from '../index';

const tests: {
  valid?: (string | RuleTester.ValidTestCase)[];
  invalid?: RuleTester.InvalidTestCase[];
} = {
  invalid: [
    {
      code: `/** @jsxImportSource @emotion/react */`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `/** @jsxImportSource @compiled/react */`,
    },
    {
      code: `import styled from '@emotion/styled';`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `import { styled } from '@compiled/react';`,
    },
    {
      code: `/** @jsx jsx */\nimport { jsx } from '@emotion/core';\nimport styled from '@emotion/styled';`,
      errors: [{ messageId: 'noEmotionCSS' }, { messageId: 'noEmotionCSS' }],
      output: `/** @jsx jsx */\nimport { jsx } from '@compiled/react';\nimport { styled } from '@compiled/react';`,
    },
    {
      code: `import sc from '@emotion/styled';`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `import { styled as sc } from '@compiled/react';`,
    },
    {
      code: `import { ClassNames } from '@emotion/core';`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `import { ClassNames } from '@compiled/react';`,
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@emotion/core';`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@compiled/react';`,
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@emotion/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@compiled/react';`,
    },
    {
      code: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@emotion/core';
    `,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@compiled/react';
    `,
    },
    {
      code: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@emotion/react';
    `,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@compiled/react';
    `,
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx } from '@emotion/core';
    `,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `
        /** @jsx jsx */
        import { css, jsx } from '@compiled/react';
    `,
    },
    {
      code: `
        import { css } from '@compiled/react';
        import styled from '@emotion/styled';`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `
        import { css, styled } from '@compiled/react';
        `,
    },
    {
      code: `import { css } from '@emotion/core';
         import { styled } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `
         import { styled, css } from '@compiled/react';`,
    },
    {
      code: `import { css } from '@emotion/react';
         import { styled } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
      output: `
         import { styled, css } from '@compiled/react';`,
    },
  ],
  valid: [
    `import { styled } from '@compiled/react';`,
    `import { css } from '@compiled/react';`,
    `import { ClassNames } from '@compiled/react';`,
    `import { css, ClassNames, styled } from '@compiled/react';`,
    `/** @jsx jsx */`,
    `/** @jsxImportSource @compiled/react */`,
  ],
};

tester.run('use-compiled-over-emotion', rule, tests);
