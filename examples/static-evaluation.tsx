import React from 'react';
import { styled } from '@compiled/core';

export default {
  title: 'static evaluation',
};

const fontSize = 12;
const colors = {
  primary: 'blue',
  danger: 'red',
};

const Block = styled.div`
  font-size: ${fontSize * 2}px;
  color: ${colors.primary};
`;

export const Styled = () => <Block>hello primary</Block>;

export const CssProp = () => (
  <div css={{ fontSize: fontSize * 3, color: colors.danger }}>hello danger</div>
);
