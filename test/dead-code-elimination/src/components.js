import React, { forwardRef } from 'react';
import { styled, ClassNames } from '@compiled/core';

export const StyledDiv = styled.div`
  display: flex;
  color: blue;
`;

export const AnotherStyledDiv = styled.div`
  display: flex;
  color: red;
`;

export const MyCssProp = /*#__PURE__*/ forwardRef(() => (
  <div css={{ fontSize: 12 }}>hello world</div>
));

export const ClassNamesWoo = /*#__PURE__*/ forwardRef(() => (
  <ClassNames>{({ css }) => <div style={css({ fontSize: 12 })}>hello world</div>}</ClassNames>
));
