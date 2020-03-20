import React from 'react';
import { Hero } from '../components/hero';
import { Header, PrimaryActions, SecondaryActions } from '../components/header';
import { Heading } from '../components/heading';
import { Comparison } from '../components/comparison';
import { CodeBlock } from '../components/code-block';
import { Content } from '../components/content';

export default () => (
  <main>
    <Header>
      <PrimaryActions>Compiled</PrimaryActions>
      <SecondaryActions>github</SecondaryActions>
    </Header>
    <Hero>
      <Content>
        <Heading as="h900">Compiled CSS in JS</Heading>
        <p>A Typescript first CSS in JS library built entirely around compilation</p>
        <Comparison
          before={`
import { styled } from '@compiled/css-in-js';

styled.div\`
  color: blue;
\`;
`}
          after={`
import React from 'react';

(props) => (
  <>
    <style>{'.a { color: blue; }'}</style>
    <div className="a">{props.children}</div>
  </>
);
`}
        />
      </Content>
    </Hero>

    <CodeBlock>
      {`
npm i @compiled/css-in-js
`}
    </CodeBlock>

    <Content>
      <Heading as="h800">Familiar APIs</Heading>

      <CodeBlock>
        {`
/** @jsx jsx */
import { jsx } from '@compiled/css-in-js';

<div css={{ color: 'blue' }}>hello, world!</div>;
`}
      </CodeBlock>

      <CodeBlock>
        {`
import { ClassNames } from '@compiled/css-in-js';

<ClassNames>
  {({ css }) => (
    <div
      className={css({ color: 'blue' })}
    >
        hello, world!
    </div>
  )}
</ClassNames>
`}
      </CodeBlock>

      <Heading as="h800">No runtime</Heading>

      <Heading as="h800">Run anywhere with zero config</Heading>

      <Heading as="h800">Made for your consumers</Heading>
    </Content>
  </main>
);
