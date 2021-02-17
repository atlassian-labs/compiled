import '@compiled/react';
import { BabelComponent } from '@private/babel-component';
import { primary } from './module';
import HelloWorld from './component';
import AnotherOne from './another-one';

export default function Home() {
  return (
    <>
      <BabelComponent>From NPM component built with Babel</BabelComponent>
      <div css={{ fontSize: 50, color: primary }}>hello from webpack</div>
      <HelloWorld>TypeScript component</HelloWorld>
      <AnotherOne>Another one</AnotherOne>
    </>
  );
}
