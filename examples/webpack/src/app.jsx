import BabelComponent from '@compiled/babel-component-fixture';
import { xcss } from '@compiled/react';
import { Suspense, lazy } from 'react';

import { primary } from './common/constants';
import Annotated from './ui/annotated';
import CSSMap from './ui/css-map';
import {
  CustomFileExtensionStyled,
  customFileExtensionCss,
} from './ui/custom-file-extension.customjsx';
import { TypeScript } from './ui/typescript';
import XCSSComponent from './ui/xcss';

const AsyncComponent = lazy(() => import('./ui/async'));

const styleOverrides = xcss({
  color: primary,
});

export const App = () => (
  <>
    <div css={{ fontSize: 50, color: primary }}>hello from webpack</div>
    <TypeScript>TypeScript component</TypeScript>
    <BabelComponent>Component from NPM</BabelComponent>
    <Suspense fallback="Loading...">
      <AsyncComponent>I was loaded async</AsyncComponent>
    </Suspense>
    <CustomFileExtensionStyled>Custom File Extension Styled</CustomFileExtensionStyled>
    <div css={customFileExtensionCss}>Custom File Extension CSS</div>
    <Annotated />
    <CSSMap variant="danger">CSS Map</CSSMap>
    <XCSSComponent xcss={styleOverrides}>XCSS Component</XCSSComponent>
  </>
);
