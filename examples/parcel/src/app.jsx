import BabelComponentExtracted from '@compiled/babel-component-extracted-fixture/dist/index';
import { css } from '@compiled/react';
import React, { lazy } from 'react';
// These are unused placeholder examples, as including them will break the application. The static evaluation in the
// @compiled/babel-plugin must be synchronous, whereas parcel offers promise-based APIs, making them incompatible.
// Eventually, the static evaluation (i.e. resolveBindingNode) should be replaced or removed so that these aliases
// and resolvers can work correctly.
// import { parcelAliasStyles } from 'parcel-alias';
// import { parcelResolverAliasStyles } from 'alias!../lib/parcel-resolver-alias.ts';

import { primary } from './constants';
import Annotated from './ui/annotated';
import CSSMap from './ui/css-map';
import {
  CustomFileExtensionStyled,
  customFileExtensionCss,
} from './ui/custom-file-extension.customjsx';
import { TypeScript } from './ui/typescript';

const AsyncComponent = lazy(() => import('./async'));
export const App = () => (
  <>
    <div css={css({ fontSize: 50, color: primary })}>hello from parcel 2</div>
    <TypeScript color="blue" />
    {/*<div css={parcelAliasStyles}>custom alias</div>*/}
    {/*<div css={parcelResolverAliasStyles}>custom resolver</div>*/}
    <BabelComponentExtracted>Component from NPM</BabelComponentExtracted>
    <CustomFileExtensionStyled>Custom File Extension Styled</CustomFileExtensionStyled>
    <div css={customFileExtensionCss}>Custom File Extension CSS</div>
    <Annotated />
    <React.Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </React.Suspense>
    <CSSMap variant="danger">CSS Map</CSSMap>
  </>
);
