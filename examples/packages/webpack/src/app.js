import '@compiled/react';
import BabelComponent from '@private/babel-component';
import { Suspense, lazy } from 'react';

import { primary } from './common/constants';
import { TypeScript } from './ui/typescript';

const AsyncComponent = lazy(() => import('./ui/async'));

export const App = () => (
  <>
    <div css={{ fontSize: 50, color: primary }}>hello from webpack</div>
    <TypeScript>TypeScript component</TypeScript>
    <BabelComponent>Component from NPM</BabelComponent>
    <Suspense fallback="Loading...">
      <AsyncComponent>I was loaded async</AsyncComponent>
    </Suspense>
  </>
);
