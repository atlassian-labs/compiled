import React from 'react';
import { styled } from '@compiled/css-in-js';

export const Header = styled.header`
  height: 8rem;
  display: flex;
  align-items: center;
  padding: 0 2rem;
  color: black;
`;

export const FixedHeader = (props: any) => (
  <>
    <div />
    <FixedHeader {...props} />
  </>
);

export const SecondaryActions = styled.nav`
  margin-left: auto;
`;

export const PrimaryActions = styled.nav``;
