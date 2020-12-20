import '@compiled/react';
import { hover } from './mixins/mixins';

const inlineMixinFunc = () => ({
  color: 'red',
});

const inlineMixinObj = {
  color: 'green',
};

export default {
  title: 'css prop | static object',
};

export const ObjectLiteral = () => {
  return <div css={{ display: 'flex', fontSize: '50px', color: 'blue' }}>blue text</div>;
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
      red text
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
      green text
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
      blue text
    </div>
  );
};

export const ObjectLiteralImportedObj = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'purple',
        ':hover': hover,
      }}>
      purple text
    </div>
  );
};
