/** @jsx jsx */
import React from 'react';
import { jsx } from '../src';
import { hover } from './mixins/mixins';

console.log(React, jsx, hover);

var inlineMixinFunc = () => ({
  color: 'red',
});

var inlineMixinObj = {
  color: 'green',
};

export default {
  title: 'css prop static object',
};

export var objectLiteral = () => {
  return <div css={{ display: 'flex', fontSize: '50px', color: 'blue' }}>Hello, world!</div>;
};

export var objectLiteralSpreadFromFunc = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        // ...inlineMixinFunc(),
      }}>
      Hello, world!
    </div>
  );
};

export var objectLiteralSpreadFromObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        // ...inlineMixinObj,
      }}>
      Hello, world!
    </div>
  );
};

export var objectLiteralLocalObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        // ':hover': inlineMixinObj,
      }}>
      Hello, world!
    </div>
  );
};

export var objectLiteralImportedObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        // ':hover': hover,
      }}>
      Hello, world!
    </div>
  );
};
