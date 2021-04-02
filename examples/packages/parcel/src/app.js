import { Suspense, lazy } from 'react';
import '@compiled/react';
import BabelComponent from '@private/babel-component';
import { primary } from './module';
import HelloWorld from './component';

const AsyncComponent = lazy(() => import('./async'));

export default function Home() {
  return (
    <>
      <div css={{ fontSize: 50, color: primary }}>hello from webpack</div>
      <HelloWorld>TypeScript component</HelloWorld>
      <BabelComponent>Component from NPM</BabelComponent>
      <Suspense fallback="Loading...">
        <AsyncComponent>I was loaded async</AsyncComponent>
      </Suspense>
    </>
  );
}
