/** @jsxImportSource @compiled/react */

import { cssProp, styled as styledExamples, classNames } from '@compiled/website-examples';
import { CompiledLogo } from '@compiled/website-ui/src/assets';
import {
  Hero,
  Heading,
  Content,
  RootLayout,
  HeaderSpacing,
  VerticalStack,
  HideSmall,
  Example,
  mdxComponents,
  PageLink,
} from '@compiled/website-ui';
import { MDXProvider } from '@mdx-js/react';
import React, { useState } from 'react';

import LandingPageContent from '../pages/landing-content.mdx';

import classNamesAfter from '!!raw-loader!@compiled/website-examples/dist/js/class-names-button.js';
import cssPropAfter from '!!raw-loader!@compiled/website-examples/dist/js/css-prop-button.js';
import styledAfter from '!!raw-loader!@compiled/website-examples/dist/js/styled-button.js';
import classNamesBefore from '!!raw-loader!@compiled/website-examples/dist/jsx/class-names-button.js';
import cssPropBefore from '!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-button.js';
import styledBefore from '!!raw-loader!@compiled/website-examples/dist/jsx/styled-button.js';

const codeBackground = 'rgba(23, 43, 77, 0.6)';

const TabButton = (props: {
  children: React.ReactNode;
  onClick: any;
  isSelected: boolean;
  id: string;
}) => {
  return (
    <button
      {...props}
      aria-selected={props.isSelected}
      role="tab"
      css={{
        padding: '12px',
        margin: 0,
        cursor: 'pointer',
        opacity: props.isSelected ? 0.99 : 0.7,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        ':hover, :focus': {
          outline: 'none',
          opacity: props.isSelected ? 1 : 0.9,
        },
        backgroundColor: 'transparent',
        border: 'none',
        '&&& *': {
          color: props.isSelected ? 'rgba(255, 255, 255, 0.99)' : 'rgba(255, 255, 255, 0.75)',
        },
        ':disabled': {
          cursor: 'not-allowed',
        },
      }}>
      <Heading as="span" look="h500">
        {props.children}
      </Heading>
    </button>
  );
};

const CodeExamples = () => {
  const [shown, setShown] = useState<'css' | 'styled' | 'cn'>('css');

  return (
    <div>
      <TabButton
        id="css-tab"
        aria-controls="css-example"
        isSelected={shown === 'css'}
        onClick={() => setShown('css')}>
        CSS prop
      </TabButton>
      <TabButton
        id="styled-tab"
        aria-controls="styled-example"
        isSelected={shown === 'styled'}
        onClick={() => setShown('styled')}>
        Styled
      </TabButton>
      <TabButton
        id="cn-tab"
        aria-controls="cn-example"
        isSelected={shown === 'cn'}
        onClick={() => setShown('cn')}>
        Class names
      </TabButton>

      {shown === 'styled' && (
        <div id="styled-example" role="tabpanel" aria-labelledby="styled-tab">
          <Example
            codeBackground={codeBackground}
            variant="fixed"
            exampleCode="<Button>Button</Button>"
            before={styledBefore}
            after={styledAfter}>
            <styledExamples.Button>Button</styledExamples.Button>
          </Example>
        </div>
      )}
      {shown === 'css' && (
        <div id="css-example" role="tabpanel" aria-labelledby="css-tab">
          <Example
            codeBackground={codeBackground}
            variant="fixed"
            exampleCode="<Button>Button</Button>"
            before={cssPropBefore}
            after={cssPropAfter}>
            <cssProp.Button>Button</cssProp.Button>
          </Example>
        </div>
      )}
      {shown === 'cn' && (
        <div id="cn-example" role="tabpanel" aria-labelledby="cn-tab">
          <Example
            codeBackground={codeBackground}
            variant="fixed"
            exampleCode="<Button>{props => <button {...props}>Button</button>}</Button>"
            before={classNamesBefore}
            after={classNamesAfter}>
            <classNames.Button>{(props) => <button {...props}>Button</button>}</classNames.Button>
          </Example>
        </div>
      )}
    </div>
  );
};

export default (): JSX.Element => (
  <RootLayout invertHeader>
    <Hero>
      <Content>
        <HeaderSpacing aria-hidden="true" />
        <VerticalStack spacing={7} gap={5}>
          <div css={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <img src={CompiledLogo} alt="Compiled CSS Logo" css={{ width: '200px', height: '200px' }} />
            <Heading
              look="h100"
              css={{
                maxWidth: '80%',
                textAlign: 'center',
              }}>
              <span
                css={{
                  color: 'rgba(255, 255, 255, 0.75)',
                }}>
                A{' '}
                <HideSmall>
                  familiar and performant
                  <br />
                </HideSmall>
                compile time CSS-in-JS library for React.
              </span>
            </Heading>
          </div>
          <CodeExamples />
        </VerticalStack>
      </Content>
    </Hero>

    <Content>
      <MDXProvider components={mdxComponents}>
        <LandingPageContent />
      </MDXProvider>

      <VerticalStack align="right" spacing={10}>
        <PageLink to="docs/installation" hard direction="next" section="Getting started">
          Installation
        </PageLink>
      </VerticalStack>
    </Content>
  </RootLayout>
);
