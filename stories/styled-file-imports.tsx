import { styled } from '@compiled/react';

import caratDown from './assets/carat-down.svg';
import caratUp from './assets/carat-up.svg';

export default {
  title: 'styled/file imports',
};

const BackgroundImage = styled.div({
  backgroundColor: 'cyan',
  backgroundImage: `url(${caratDown})`,
  backgroundSize: '64px 64px',
  width: '64px',
  height: '64px',
});

export const StyledBackgroundImage = (): JSX.Element => <BackgroundImage />;

const BackgroundImageMultiple = styled.div({
  backgroundColor: 'cyan',
  backgroundImage: `url(${caratDown}), url(${caratUp})`,
  backgroundSize: '64px 64px',
  width: '64px',
  height: '64px',
});

export const StyledBackgroundImageMultiple = (): JSX.Element => <BackgroundImageMultiple />;
