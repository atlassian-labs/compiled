/** @jsxImportSource @compiled/react */
import { CodeBlock } from './code-block';
import { HorizontalStack } from './stack';

interface ComparisonProps {
  before: string;
  after: string;
  maxHeight?: string;
}

export const Comparison = (props: ComparisonProps): JSX.Element => {
  return (
    <HorizontalStack
      gap={1}
      css={{
        display: 'flex',
        alignItems: 'stretch',
        '> *': {
          flexGrow: 1,
          flexShrink: 1,
          maxHeight: props.maxHeight,
        },
      }}>
      <CodeBlock>{props.before}</CodeBlock>
      <CodeBlock>{props.after}</CodeBlock>
    </HorizontalStack>
  );
};
