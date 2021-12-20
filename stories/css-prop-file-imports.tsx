/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

import caratDown from './assets/carat-down.svg';
import caratUp from './assets/carat-up.svg';

export default {
  title: 'css prop/file imports',
};

export const CallExpressionUrl = (): JSX.Element => (
  <div
    css={css({
      backgroundColor: 'cyan',
      backgroundImage: `url(${caratDown})`,
      backgroundSize: '64px 64px',
      width: '64px',
      height: '64px',
    })}
  />
);

export const CallExpressionMultipleUrl = (): JSX.Element => (
  <div
    css={css({
      backgroundColor: 'cyan',
      backgroundImage: `url(${caratDown}), url(${caratUp})`,
      backgroundSize: '64px 64px',
      width: '64px',
      height: '64px',
    })}
  />
);

export const TaggedTemplateExpressionUrl = (): JSX.Element => (
  <div
    css={css`
      background-color: cyan;
      background-image: url(${caratDown});
      background-size: 64px 64px;
      width: 64px;
      height: 64px;
    `}
  />
);

export const TaggedTemplateExpressionMultipleUrl = (): JSX.Element => (
  <div
    css={css`
      background-color: cyan;
      background-image: url(${caratDown}), url(${caratUp});
      background-size: 64px 64px;
      width: 64px;
      height: 64px;
    `}
  />
);
