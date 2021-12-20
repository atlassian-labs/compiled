import transformer from '../styled-components-to-compiled';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

describe('styled-components-to-compiled components transformer', () => {
  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default styled.input\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export default styled.input\`
      position: absolute;
    \`;
    `,
    'it should export component as default'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const TestComponent = styled.input\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export const TestComponent = styled.input\`
      position: absolute;
    \`;
    `,
    'it should export component as named export'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const TestComponent = styled.input\`
      position: absolute;
    \`;

    export default styled.input\`
      position: fixed;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export const TestComponent = styled.input\`
      position: absolute;
    \`;

    export default styled.input\`
      position: fixed;
    \`;
    `,
    'it should handle mixed exports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const AbsoluteComponent = styled.input\`
      position: absolute;
    \`;

    export const FixedComponent = styled.input\`
      position: fixed;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export const AbsoluteComponent = styled.input\`
      position: absolute;
    \`;

    export const FixedComponent = styled.input\`
      position: fixed;
    \`;
    `,
    'it should handle multiple exports'
  );
});
