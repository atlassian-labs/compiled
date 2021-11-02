import type { RuleTester } from 'eslint';
import { tester } from '../../__tests__/test-utils';
import rule from '../index';

const tests: {
  valid?: Array<string | RuleTester.ValidTestCase>;
  invalid?: RuleTester.InvalidTestCase[];
} = {
  valid: [
    `import { styled } from '@compiled/react';`,
    `import { css } from '@compiled/react';`,
    `import { ClassNames } from '@compiled/react';`,
    `import { css, ClassNames, styled } from '@compiled/react';`,
  ],
  invalid: [
    {
      code: `import styled from '@emotion/styled';`,
      output: `import { styled } from '@compiled/react';`,
      errors: [{ messageId: 'noStyled' }],
    },
    {
      code: `/** @jsx jsx */\nimport { jsx } from '@emotion/core';\nimport styled from '@emotion/styled';`,
      output: `import * as React from 'react';\n\nimport { styled } from '@compiled/react';`,
      errors: [{ messageId: 'noPragma' }, { messageId: 'noCore' }, { messageId: 'noStyled' }],
    },
    {
      code: `import sc from '@emotion/styled';`,
      output: `import { styled as sc } from '@compiled/react';`,
      errors: [{ messageId: 'noStyled' }],
    },
    {
      code: `import { ClassNames } from '@emotion/core';`,
      output: `import { ClassNames } from '@compiled/react';`,
      errors: [{ messageId: 'noCore' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@emotion/core';`,
      output: `
        import * as React from 'react';
        import { css, ClassNames } from '@compiled/react';`,
      errors: [{ messageId: 'noPragma' }, { messageId: 'noCore' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx, ClassNames } from '@emotion/react';`,
      output: `
        import * as React from 'react';
        import { css, ClassNames } from '@compiled/react';`,
      errors: [{ messageId: 'noPragma' }, { messageId: 'noCore' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@emotion/core';
    `,
      output: `
        import * as React from 'react';
        import { css as c, ClassNames as CN } from '@compiled/react';
    `,
      errors: [{ messageId: 'noPragma' }, { messageId: 'noCore' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css as c, jsx, ClassNames as CN } from '@emotion/react';
    `,
      output: `
        import * as React from 'react';
        import { css as c, ClassNames as CN } from '@compiled/react';
    `,
      errors: [{ messageId: 'noPragma' }, { messageId: 'noCore' }],
    },
    {
      code: `
        /** @jsx jsx */
        import { css, jsx } from '@emotion/core';
    `,
      output: `
        import * as React from 'react';
        import { css } from '@compiled/react';
    `,
      errors: [{ messageId: 'noPragma' }, { messageId: 'noCore' }],
    },
    {
      code: `
        import { css } from '@compiled/react';
        import styled from '@emotion/styled';`,
      output: `
        import { css, styled } from '@compiled/react';
        `,
      errors: [{ messageId: 'noStyled' }],
    },
    {
      code: `import { css } from '@emotion/core';
         import { styled } from '@compiled/react';`,
      output: `
         import { styled, css } from '@compiled/react';`,
      errors: [{ messageId: 'noCore' }],
    },
    {
      code: `import { css } from '@emotion/react';
         import { styled } from '@compiled/react';`,
      output: `
         import { styled, css } from '@compiled/react';`,
      errors: [{ messageId: 'noCore' }],
    },
  ],
};

tester.run('use-compiled-over-emotion', rule, tests);
