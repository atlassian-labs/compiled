import React, { useState } from 'react';
import { styled } from '../src';

export default {
  title: 'styled component dynamic object',
};

var Thing = styled.div<{ color: string }>({
  fontSize: '20px',
  color: props => props.color,
});

export var objectLiteral = () => {
  var [color, setColor] = useState('blue');

  return (
    <>
      <Thing color={color}>hello world</Thing>
      <button onClick={() => setColor('red')}>red</button>
      <button onClick={() => setColor('green')}>green</button>
      <button onClick={() => setColor('blue')}>blue</button>
    </>
  );
};
