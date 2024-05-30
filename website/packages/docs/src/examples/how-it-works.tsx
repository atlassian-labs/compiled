import { CodeBlock } from '@compiled/website-ui';

const before =
  require('!!raw-loader!@compiled/website-examples/dist/jsx/styled-dynamic-decl.js').default;
const after =
  require('!!raw-loader!@compiled/website-examples/dist/js/styled-dynamic-decl.js').default;

export const BeforeHowItWorks = () => (
  <CodeBlock language="jsx">{before}</CodeBlock>
);

export const AfterHowItWorks = () => (
  <CodeBlock language="jsx">{after}</CodeBlock>
);
