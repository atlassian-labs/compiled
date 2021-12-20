import { styled } from '@compiled/react';

import caratDown from './assets/carat-down.svg';
import caratUp from './assets/carat-up.svg';

export default {
  title: 'styled/file imports',
};

const CallExpressionBackgroundImage = styled.div({
  backgroundColor: 'cyan',
  backgroundImage: `url(${caratDown})`,
  backgroundSize: '64px 64px',
  width: '64px',
  height: '64px',
});

export const CallExpressionUrl = (): JSX.Element => <CallExpressionBackgroundImage />;

const CallExpressionMultipleBackgroundImage = styled.div({
  backgroundColor: 'cyan',
  backgroundImage: `url(${caratDown}), url(${caratUp})`,
  backgroundSize: '64px 64px',
  width: '64px',
  height: '64px',
});

export const CallExpressionMultipleUrl = (): JSX.Element => (
  <CallExpressionMultipleBackgroundImage />
);

const TaggedTemplateExpressionBackgroundImage = styled.div`
  background-color: cyan;
  background-image: url(${caratDown});
  background-size: 64px 64px;
  width: 64px;
  height: 64px;
`;

export const TaggedTemplateExpressionUrl = (): JSX.Element => (
  <TaggedTemplateExpressionBackgroundImage />
);

const TaggedTemplateExpressionMultipleBackgroundImage = styled.div`
  background-color: cyan;
  background-image: url(${caratDown}), url(${caratUp});
  background-size: 64px 64px;
  width: 64px;
  height: 64px;
`;

export const TaggedTemplateExpressionMultipleUrl = (): JSX.Element => (
  <TaggedTemplateExpressionMultipleBackgroundImage />
);
