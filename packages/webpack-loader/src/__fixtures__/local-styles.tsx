import React from 'react';
import { styled } from '@compiled/react';

const Styled = styled.div({
  color: 'blue',
});

export const App = (): JSX.Element => (
  <>
    <div css={{ fontSize: 14 }} />
    <Styled />
  </>
);
