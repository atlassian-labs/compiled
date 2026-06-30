/** @jsx jsx */
import { jsx, styled } from '@compiled/react';
import { Fragment, type JSX } from 'react';

const Styled = styled.div({
  color: 'blue',
});

export const App = (): JSX.Element => (
  <Fragment>
    <div css={{ fontSize: 14 }} />
    <Styled />
  </Fragment>
);
