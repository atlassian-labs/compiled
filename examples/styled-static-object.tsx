import React from 'react';
import { styled } from '@compiled/core';

export default {
  title: 'styled | static object',
};

const Thing = styled.div({
  fontSize: '20px',
  color: 'red',
});

export const ObjectLiteral = () => <Thing>hello world</Thing>;
