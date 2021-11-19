import { styled } from '@compiled/react';
import { useState } from 'react';

export default {
  title: 'styled/dynamic object',
};

const Highlight = styled.div<{ primary: string }>({
  fontSize: '20px',
  color: (props) => props.primary,
  margin: '20px',
  ':hover': {
    color: 'red',
  },
});

export const ObjectLiteral = (): JSX.Element => {
  const [color, setColor] = useState('blue');

  return (
    <>
      <Highlight primary={color}>hello world</Highlight>

      <button onClick={() => setColor('red')}>red</button>
      <button onClick={() => setColor('green')}>green</button>
      <button onClick={() => setColor('blue')}>blue</button>
    </>
  );
};
