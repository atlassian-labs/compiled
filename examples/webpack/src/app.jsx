import BabelComponentExtracted from '@compiled/babel-component-extracted-fixture/dist/index';
import BabelComponent from '@compiled/babel-component-fixture';
import { css } from '@compiled/react';
import { Suspense, lazy } from 'react';

import { primary } from './common/constants';
import Annotated from './ui/annotated';
import CSSMap from './ui/css-map';
import {
  CustomFileExtensionStyled,
  customFileExtensionCss,
} from './ui/custom-file-extension.customjsx';
import { StartingStyleExample } from './ui/starting-style';
import { TypeScript } from './ui/typescript';

const AsyncComponent = lazy(() => import('./ui/async'));

export const App = () => (
  <>
    <div css={css({ fontSize: 50, color: primary })}>hello from webpack</div>
    <TypeScript>TypeScript component</TypeScript>
    <BabelComponent>Component from NPM</BabelComponent>
    <Suspense fallback="Loading...">
      <AsyncComponent>I was loaded async</AsyncComponent>
    </Suspense>
    <BabelComponentExtracted>Component from NPM</BabelComponentExtracted>
    <CustomFileExtensionStyled>Custom File Extension Styled</CustomFileExtensionStyled>
    <div css={customFileExtensionCss}>Custom File Extension CSS</div>
    <Annotated />
    <CSSMap variant="danger">CSS Map</CSSMap>
    <StartingStyleExample />
  </>
);
