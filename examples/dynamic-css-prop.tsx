/** @jsx jsx */
import { jsx } from '../src';
import { useState } from 'react';

export default {
  title: 'dynamic',
};

export var dynamicCssProp = () => {
  // works with var, but not let or const ????
  var [color, setColor] = useState('red');

  return (
    <div
      css={{
        padding: '20px',
        ':hover': {
          backgroundColor: 'purple',
        },
      }}>
      <div css={{ display: 'flex', fontSize: '20px', color }}>Hello, world!</div>

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
        strip yeah
      </div>
    </div>
  );
};
