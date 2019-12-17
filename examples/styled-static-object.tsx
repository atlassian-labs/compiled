import React from 'react';
import { styled } from '../src';

export default {
  title: 'styled component static object',
};

var Thing = styled.div({
  fontSize: '20px',
  color: 'red',
});

export var objectLiteral = () => <Thing>hello world</Thing>;
