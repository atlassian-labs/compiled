import React, { useState } from 'react';
import '@compiled/react';

export default {
  title: 'css prop | dynamic object',
};

export const DynamicCssProp = () => {
  const [color, setColor] = useState('red');

  return (
    <div
      css={{
        padding: '20px',
        ':hover': {
          backgroundColor: 'purple',
        },
      }}>
      <div css={{ display: 'flex', fontSize: '20px', color }}>{color} text</div>

      <div
        css={{
          '> *': {
            margin: '10px',
          },
        }}>
        <button onClick={() => setColor('red')}>red</button>
        <button onClick={() => setColor('green')}>green</button>
        <button onClick={() => setColor('blue')}>blue</button>
      </div>

      <div
        css={`
          display: block;
          font-size: 20px;
        `}>
        black text
      </div>
    </div>
  );
};

const NestedColor = ({ color }: { color: string }) => (
  <div css={{ div: { color: 'blue' } }}>
    <div css={{ color: `${color} !important` }}>I SHOULD BE RED</div>
  </div>
);

export const ImportantChild = () => <NestedColor color="red" />;
