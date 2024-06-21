/** @jsxImportSource @compiled/react */

import { styled } from '@compiled/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CodeBlock, colors, Text } from '@compiled/website-ui';
import { useState } from 'react';

interface ExampleProps {
  before: string;
  after: string;
  children: JSX.Element;
  variant?: 'fixed' | 'fluid';
  codeBackground?: string;
  exampleCode?: string;
}

export const ExampleRoot = styled.div`
  box-shadow: rgba(9, 30, 66, 0.25) 0px 12px 24px -6px, rgba(9, 30, 66, 0.31) 0px 0px 1px;
  border-radius: 8px;
  overflow: hidden;
`;

const ExampleSwitcher = styled.div`
  display: flex;

  > * {
    width: 100%;
    flex-shrink: 0;
  }

  > :first-child {
    display: block;
  }

  > :last-child {
    display: none;
  }

  &[data-is-shown='true'] {
    > :first-child {
      display: none;
    }

    > :last-child {
      display: block;
    }
  }
`;

const ExampleButton = styled.button<{
  fullWidth?: boolean;
  isSelected?: boolean;
}>`
  flex-shrink: 0;
  border-radius: 5px 5px 0 0;
  display: block;
  width: ${(props) => (props.fullWidth ? '100%' : 'auto')};
  padding-top: 12px;
  padding-bottom: 12px;
  border: none;
  background: ${(props) => (props.fullWidth ? 'rgba(255, 255, 255, 0.75)' : 'transparent')};
  text-align: center;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 11px;
  color: ${(props) => (props.isSelected ? colors.primary : 'rgba(37, 56, 88, 0.8)')};
  margin: 0;
  outline: none;
  font-family: inherit;

  :hover {
    color: ${colors.primary};
  }
`;

export const ExampleContainer = styled.div`
  background-color: #fff;
  display: flex;
  border-radius: 0 0 5px 5px;
  z-index: 1;
  position: relative;
  padding: 0.5rem;
  min-height: 65px;
  background-image: linear-gradient(45deg, #f4f5f7 25%, transparent 25%),
    linear-gradient(-45deg, #f4f5f7 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f4f5f7 75%),
    linear-gradient(-45deg, transparent 75%, #f4f5f7 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;

  [data-button] {
    margin-left: auto;
  }
`;

export const Example = ({
  before,
  after,
  children,
  codeBackground = 'rgb(37, 56, 88)',
  variant = 'fluid',
  exampleCode,
}: ExampleProps): JSX.Element => {
  const [isShown, setIsShown] = useState(false);
  const [htmlShown, setHtmlShown] = useState(false);

  return (
    <ExampleRoot>
      <ExampleButton fullWidth onClick={() => setIsShown((prev) => !prev)}>
        <Text weight="bold" variant="supplementary">
          {isShown ? 'View source code' : 'View transformed code'}
        </Text>
      </ExampleButton>
      <ExampleSwitcher data-is-shown={isShown}>
        <CodeBlock
          css={{
            backgroundColor: codeBackground,
            height: variant === 'fixed' ? '400px' : 'auto',
          }}
          variant="sharp">
          {before}
        </CodeBlock>
        <CodeBlock
          css={{
            backgroundColor: codeBackground,
            height: variant === 'fixed' ? '400px' : 'auto',
          }}
          variant="sharp">
          {after}
        </CodeBlock>
      </ExampleSwitcher>

      <ExampleContainer>
        <span css={{ display: 'flex', padding: '1.5rem', alignItems: 'center' }}>{children}</span>
        {exampleCode && (
          <ExampleButton
            data-button
            isSelected={htmlShown}
            aria-pressed={htmlShown}
            onClick={() => setHtmlShown((prev) => !prev)}>
            <Text variant="supplementary" weight="bold">
              {htmlShown ? 'Hide' : 'Show'} JSX Markup
            </Text>
          </ExampleButton>
        )}

        {exampleCode && (
          <span
            css={{
              opacity: htmlShown ? 1 : 0,
              pointerEvents: htmlShown ? 'auto' : 'none',
              transition: 'opacity 50ms',
              position: 'absolute',
              top: 5,
              left: 5,
              maxWidth: 'calc(100% - 140px)',
            }}>
            <CodeBlock>{exampleCode}</CodeBlock>
          </span>
        )}
      </ExampleContainer>
    </ExampleRoot>
  );
};
