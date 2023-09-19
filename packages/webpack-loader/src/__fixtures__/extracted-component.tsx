/** @jsx jsx */
import { jsx, css } from '@compiled/react';
import { Fragment } from 'react';

import './extracted-component.compiled.css';

const Component = (): JSX.Element => (
  <Fragment>
    <div css={css({ fontSize: '12px', color: 'blue' })} />
  </Fragment>
);

export default Component;
