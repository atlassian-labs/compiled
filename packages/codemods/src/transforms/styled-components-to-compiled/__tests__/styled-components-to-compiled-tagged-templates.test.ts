import transformer from '../index';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

describe('styled-components-to-compiled tagged template conversion', () => {
  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default styled.input\`
      // position absolute comment
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export default styled.input\`
      /* position absolute comment */
      position: absolute;
    \`;
    `,
    'it should convert inline comments into multi-line comments'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default styled.input\`
      position: absolute; // position absolute comment
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export default styled.input\`
      position: absolute; /* position absolute comment */
    \`;
    `,
    'it should convert inline comments at the end of the string into multi-line comments'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default styled.input\`
      position: absolute;
      // position absolute comment
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export default styled.input\`
      position: absolute;
      /* position absolute comment */
    \`;
    `,
    'it should convert inline comments at the end of the template into multi-line comments'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default styled.input\`
      // position absolute comment
      position: absolute;
      background: url('https://atlassian.com/test-img.jpg');
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export default styled.input\`
      /* position absolute comment */
      position: absolute;
      background: url('https://atlassian.com/test-img.jpg');
    \`;
    `,
    'it should convert comments but ignore urls'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default styled.input\`
      // position absolute comment. more info here http://atlassian.com/
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export default styled.input\`
      /* position absolute comment. more info here http://atlassian.com/ */
      position: absolute;
    \`;
    `,
    'it should convert comments but ignore urls inside comments'
  );
});
