import { CodeBlock } from '@compiled/website-ui';

const after =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('!!raw-loader!@compiled/website-examples/dist/js/styled-dynamic-decl.js').default;
const before =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('!!raw-loader!@compiled/website-examples/dist/jsx/styled-dynamic-decl.js').default;

export const BeforeHowItWorks = (): JSX.Element => <CodeBlock language="jsx">{before}</CodeBlock>;

export const AfterHowItWorks = (): JSX.Element => <CodeBlock language="jsx">{after}</CodeBlock>;
