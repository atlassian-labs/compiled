import { css } from '@compiled/react';

export default {
  title: 'css prop/string',
};

export const TemplateLiteral = (): JSX.Element => {
  return (
    <div
      css={`
        display: flex;
        font-size: 50px;
        color: blue;
      `}>
      blue text
    </div>
  );
};

export const TemplateLiteralCSS = (): JSX.Element => {
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
