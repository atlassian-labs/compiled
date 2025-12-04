/** @jsxImportSource @compiled/react */
import * as BabelComponentExtractedModule from '@compiled/babel-component-extracted-fixture/dist/index';
import * as BabelComponentModule from '@compiled/babel-component-fixture';
import { css } from '@compiled/react';
import { Suspense, lazy } from 'react';

import { primary } from './constants';
import Annotated from './ui/annotated';
import CSSMap from './ui/css-map';
import { TypeScript } from './ui/typescript';

const AsyncComponent = lazy(() => import('./ui/async'));

// Handle CommonJS default exports for Vite
const BabelComponent = (BabelComponentModule as any).default || BabelComponentModule;
const BabelComponentExtracted =
  (BabelComponentExtractedModule as any).default || BabelComponentExtractedModule;

export const App = (): JSX.Element => (
  <>
    <div css={css({ fontSize: 50, color: primary })}>hello from vite</div>
    <TypeScript>TypeScript component</TypeScript>
    <BabelComponent>Component from NPM</BabelComponent>
    <Suspense fallback="Loading...">
      <AsyncComponent>I was loaded async</AsyncComponent>
    </Suspense>
    <BabelComponentExtracted>Component from NPM</BabelComponentExtracted>
    <Annotated />
    <CSSMap variant="danger">CSS Map</CSSMap>
  </>
);
