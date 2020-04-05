import React, { useState } from 'react';
import { styled } from '@compiled/css-in-js';

export default {
  title: 'styled component dynamic object',
};

const Highlight = styled.div<{ primary: string }>({
  fontSize: '20px',
  color: props => props.primary,
  margin: '20px',
  ':hover': {
    color: 'red',
  },
});

export const objectLiteral = () => {
  const [color, setColor] = useState('blue');

  return (
    <React.Fragment>
      <Highlight primary={color}>hello world</Highlight>

      <button onClick={() => setColor('red')}>red</button>
      <button onClick={() => setColor('green')}>green</button>
      <button onClick={() => setColor('blue')}>blue</button>
    </React.Fragment>
  );
};
