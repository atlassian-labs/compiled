import '@compiled/react';
import { css } from '@compiled/react';
import { hover, primary } from '../mixins/mixins';

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
        ':hover': hover,
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

const objectLiteralTaggedCss = css({
  display: 'flex',
  fontSize: '30px',
  color: 'purple',
});

export const ObjectLiteralCssTagged = (): JSX.Element => {
  return <div css={objectLiteralTaggedCss}>purple text</div>;
};

const variableColor = 'orange';

const objectLiteralTaggedCssVariable = css({
  display: 'flex',
  fontSize: '30px',
  color: variableColor,
});

export const ObjectLiteralCssTaggedVariable = (): JSX.Element => {
  return <div css={objectLiteralTaggedCssVariable}>orange text</div>;
};

export const ObjectLiteralCssTaggedImport = (): JSX.Element => {
  return <div css={primary}>primary text</div>;
};

const objectLiteralCssTaggedVariableImportVariable = {
  ...primary,
  backgroundColor: 'cyan',
};

export const ObjectLiteralCssTaggedVariableImport = (): JSX.Element => {
  return <div css={objectLiteralCssTaggedVariableImportVariable}>primary text</div>;
};
