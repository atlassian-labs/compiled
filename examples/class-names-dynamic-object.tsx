import React, { useState } from 'react';
import { ClassNames } from '@compiled/core';

export default {
  title: 'class names dynamic object',
};

export const ObjectLiteral = () => {
  const [color, setColor] = useState('blue');

  return (
    <div>
      <ClassNames>
        {({ css, style }) => (
          <div style={style} className={css({ color, fontSize: '40px' })}>
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
