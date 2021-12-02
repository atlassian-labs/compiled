import '@compiled/react';
import { hoverObjectLiteral } from './mixins';

const inlineMixinFunc = () => ({
  color: 'red',
});

const inlineMixinObj = {
  color: 'green',
};

export default {
  title: 'css prop/static object',
};

export const ObjectLiteral = (): JSX.Element => {
  return <div css={{ display: 'flex', fontSize: '50px', color: 'blue' }}>blue text</div>;
};

export const ObjectLiteralSpreadFromFunc = (): JSX.Element => {
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

export const ObjectLiteralSpreadFromObj = (): JSX.Element => {
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

export const ObjectLiteralLocalObj = (): JSX.Element => {
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

export const ObjectLiteralImportedObj = (): JSX.Element => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'purple',
        ':hover': hoverObjectLiteral,
      }}>
      purple text
    </div>
  );
};

export const ObjectLiteralMapWithKeys = (): JSX.Element => (
  <div>
    {['foo', 'bar'].map((string) => (
      <div key={string} css={{ backgroundColor: 'blue' }}>
        {string}
      </div>
    ))}
  </div>
);

export const ObjectExpressionDisabledSameLine = (): JSX.Element => (
  <h1
    css={{ color: 'red' }} // @compiled-disable-line transform-css-prop
  >
    Black text
  </h1>
);

export const ObjectExpressionDisabledNextLine = (): JSX.Element => (
  <h1
    // @compiled-disable-next-line transform-css-prop
    css={{ color: 'red' }}>
    Black text
  </h1>
);
