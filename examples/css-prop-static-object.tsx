import * as React from 'react';
import '@compiled/css-in-js';
import { hover } from './mixins/mixins';

const inlineMixinFunc = () => ({
  color: 'red',
});

const inlineMixinObj = {
  color: 'green',
};

export default {
  title: 'css prop static object',
};

export const ObjectLiteral = () => {
  return <div css={{ display: 'flex', fontSize: '50px', color: 'blue' }}>Hello, world!</div>;
};

export const ObjectLiteralSpreadFromFunc = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        ...inlineMixinFunc(),
      }}>
      Hello, world!
    </div>
  );
};

export const ObjectLiteralSpreadFromObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        ...inlineMixinObj,
      }}>
      Hello, world!
    </div>
  );
};

export const ObjectLiteralLocalObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        ':hover': inlineMixinObj,
      }}>
      Hello, world!
    </div>
  );
};

export const ObjectLiteralImportedObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        ':hover': hover,
      }}>
      Hello, world!
    </div>
  );
};
