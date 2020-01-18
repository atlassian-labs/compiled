import React from 'react';
import { ClassNames } from '@compiled/css-in-js';

export default {
  title: 'class names static object',
};

export const objectLiteral = () => (
  <ClassNames>
    {({ css }) => <div className={css({ fontSize: '30px' })}>hello world</div>}
  </ClassNames>
);
