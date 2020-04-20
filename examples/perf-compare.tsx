import * as React from 'react';
import * as CompiledStyled from './libs/compiled-styled';
import * as EmotionStyled from './libs/emotion-styled';
import * as StyledComponents from './libs/styled-components';

export default {
  title: 'perf compare',
};

export const CompiledStatic = () => <CompiledStyled.Static>Hello world</CompiledStyled.Static>;

export const EmotionStatic = () => <EmotionStyled.Static>Hello world</EmotionStyled.Static>;

export const StyledStatic = () => <StyledComponents.Static>Hello world</StyledComponents.Static>;

export const CompiledDynamic = () => (
  <CompiledStyled.Dynamic color="red">Hello world</CompiledStyled.Dynamic>
);

export const EmotionDynamic = () => (
  <EmotionStyled.Dynamic color="blue">Hello world</EmotionStyled.Dynamic>
);

export const StyledDynamic = () => (
  <StyledComponents.Dynamic color="green">Hello world</StyledComponents.Dynamic>
);
