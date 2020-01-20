/** @jsx jsx */
import { jsx } from '@compiled/css-in-js';
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

export const objectLiteral = () => {
  return <div css={{ display: 'flex', fontSize: '50px', color: 'blue' }}>Hello, world!</div>;
};

export const objectLiteralSpreadFromFunc = () => {
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

export const objectLiteralSpreadFromObj = () => {
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

export const objectLiteralLocalObj = () => {
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

export const objectLiteralImportedObj = () => {
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
