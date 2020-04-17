import React, { useState } from 'react';
import { ClassNames } from '@compiled/css-in-js';

export default {
  title: 'class names sdynamic object',
};

export const objectLiteral = () => {
  const [color, setColor] = useState('blue');

  return (
    <div>
      <ClassNames>
        {({ css, style }) => (
          <div style={style} className={css({ color, fontSize: '30px' })}>
            hello world
          </div>
        )}
      </ClassNames>

      <button onClick={() => setColor('red')}>red</button>
      <button onClick={() => setColor('green')}>green</button>
      <button onClick={() => setColor('blue')}>blue</button>
    </div>
  );
};
