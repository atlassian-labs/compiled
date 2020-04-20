import * as React from 'react';
import { styled } from '@compiled/css-in-js';

export default {
  title: 'styled component static object',
};

const Thing = styled.div({
  fontSize: '20px',
  color: 'red',
});

export const ObjectLiteral = () => <Thing>hello world</Thing>;
