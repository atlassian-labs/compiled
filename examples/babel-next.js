import React from 'react';
import { styled } from '@compiled/core';

export default {
  title: 'babel next',
};

const Thing = styled.div`
  font-size: 20px;
  color: red;
`;

export const ObjectLiteral = () => <Thing>hello world</Thing>;
