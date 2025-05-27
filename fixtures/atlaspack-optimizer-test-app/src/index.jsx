import { styled } from '@compiled/react';
import * as React from 'react';

const ComponentA = styled.div({
  color: 'red',
  ':hover': {
    color: 'green',
  },
  ':focus': {
    color: 'orange',
  },
});

const ComponentB = styled.div({
  '@media screen': {
    color: 'red',
  },
});

const ComponentC = styled.div({
  '@media (min-width: 500px)': {
    border: '2px solid red',
  },
});

const ComponentD = styled.div({
  '@media (min-width: 500px)': {
    border: '2px solid red',
    content: 'large screen',
  },
});

const App = () => (
  <>
    <ComponentA />
    <ComponentB />
    <ComponentC />
    <ComponentD />
  </>
);
