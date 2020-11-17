import React from 'react';
import { styled } from '@compiled/react';

export default {
  title: 'styled | static object',
};

const Thing = styled.div({
  fontSize: '20px',
  color: 'red',
});

export const ObjectLiteral = () => <Thing>hello world</Thing>;
