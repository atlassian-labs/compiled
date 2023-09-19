/** @jsx jsx */
// @ts-ignore
import BabelComponentExtracted from '@compiled/babel-component-extracted-fixture/dist/index';
import { jsx, css } from '@compiled/react';
import { Fragment } from 'react';

const Component = (): JSX.Element => (
  <Fragment>
    <div css={css({ fontSize: '12px', color: 'blue' })} />
    <BabelComponentExtracted>Component from NPM</BabelComponentExtracted>
  </Fragment>
);

export default Component;
