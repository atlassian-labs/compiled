import React from 'react';
import { styled } from '@compiled/css-in-js';

export default {
  title: 'styled component static object',
};

const Thing = styled.div({
  fontSize: '20px',
  color: 'red',
});

export const objectLiteral = () => <Thing>hello world</Thing>;
