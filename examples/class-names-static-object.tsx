import React from 'react';
import { ClassNames } from '../src';

export default {
  title: 'class names static object',
};

export var objectLiteral = () => (
  <ClassNames>
    {({ css }) => <div className={css({ fontSize: '30px' })}>hello world</div>}
  </ClassNames>
);
