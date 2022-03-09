import { styled } from '@compiled/react';

export default {
  title: 'css/negative css values',
};

const gridSize = 8;

const LayoutRight = styled.aside`
  position: relative;
  margin-right: -${gridSize * 5}px;
  margin-left: ${gridSize * 5}px;
  top: -${gridSize}px;
  bottom: ${gridSize}px;
  left: -6px;
  right: 6px;
  color: blue;
`;

export const NegativeCssValues = (): JSX.Element => <LayoutRight>Layout Right</LayoutRight>;
