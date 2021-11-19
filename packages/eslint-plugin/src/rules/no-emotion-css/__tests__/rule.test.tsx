import type { RuleTester } from 'eslint';

import { tester } from '../../__tests__/test-utils';
import rule from '../index';

const tests: {
  valid?: (string | RuleTester.ValidTestCase)[];
  invalid?: RuleTester.InvalidTestCase[];
} = {
  valid: [
    `import { styled } from '@compiled/react';`,
    `import { css } from '@compiled/react';`,
    `import { ClassNames } from '@compiled/react';`,
    `import { css, ClassNames, styled } from '@compiled/react';`,
    `/** @jsx jsx */`,
    `/** @jsxImportSource @compiled/react */`,
  ],
  invalid: [
    {
      code: `/** @jsxImportSource @emotion/react */`,
      output: `/** @jsxImportSource @compiled/react */`,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `import styled from '@emotion/styled';`,
      output: `import { styled } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `/** @jsx jsx */\nimport { jsx } from '@emotion/core';\nimport styled from '@emotion/styled';`,
      output: `/** @jsx jsx */\nimport { jsx } from '@compiled/react';\nimport { styled } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }, { messageId: 'noEmotionCSS' }],
    },
    {
      code: `import sc from '@emotion/styled';`,
      output: `import { styled as sc } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `import { ClassNames } from '@emotion/core';`,
      output: `import { ClassNames } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@emotion/core';`,
      output: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@emotion/react';`,
      output: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@emotion/core';
    `,
      output: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@compiled/react';
    `,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@emotion/react';
    `,
      output: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@compiled/react';
    `,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx } from '@emotion/core';
    `,
      output: `
        /** @jsx jsx */
        import { css, jsx } from '@compiled/react';
    `,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `
        import { css } from '@compiled/react';
        import styled from '@emotion/styled';`,
      output: `
        import { css, styled } from '@compiled/react';
        `,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `import { css } from '@emotion/core';
         import { styled } from '@compiled/react';`,
      output: `
         import { styled, css } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
    {
      code: `import { css } from '@emotion/react';
         import { styled } from '@compiled/react';`,
      output: `
         import { styled, css } from '@compiled/react';`,
      errors: [{ messageId: 'noEmotionCSS' }],
    },
  ],
};

tester.run('use-compiled-over-emotion', rule, tests);
