/** @jsx jsx */
import { jsx, css } from '@compiled/react';
import { Fragment } from 'react';

import BabelComponentExtracted from '../../../../fixtures/babel-component-extracted/dist/';

const Component = (): JSX.Element => (
  <Fragment>
    <div css={css({ fontSize: '12px', color: 'blue' })} />
    <BabelComponentExtracted>Component from NPM</BabelComponentExtracted>
  </Fragment>
);

export default Component;
