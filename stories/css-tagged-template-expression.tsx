import { css } from '@compiled/react';

import { primaryTaggedTemplateExpression } from './mixins';

export default {
  title: 'css/tagged template expression',
};

export const Static = (): JSX.Element => {
  const styles = css`
    display: flex;
    font-size: 30px;
    color: green;
  `;

  return <div css={styles}>green text</div>;
};

export const Inline = (): JSX.Element => {
  return (
    <div
      css={css`
        display: flex;
        font-size: 30px;
        color: red;
      `}>
      red text
    </div>
  );
};

export const LocalVariable = (): JSX.Element => {
  const variableColor = 'orange';
  const styles = css`
    display: flex;
    font-size: 30px;
    color: ${variableColor};
  `;

  return <div css={styles}>orange text</div>;
};

export const ImportedVariable = (): JSX.Element => {
  return <div css={primaryTaggedTemplateExpression}>bold, underlined primary text</div>;
};
