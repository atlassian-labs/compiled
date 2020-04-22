import React from 'react';
import { styled, ClassNames } from '@compiled/css-in-js';

export const StyledDiv = styled.div`
  display: flex;
  color: blue;
`;

export const AnotherStyledDiv = styled.div`
  display: flex;
  color: red;
`;

export const MyCssProp = () => <div css={{ fontSize: 12 }}>hello world</div>;

export const ClassNamesWoo = () => (
  <ClassNames>{({ css }) => <div style={css({ fontSize: 12 })}>hello world</div>}</ClassNames>
);
