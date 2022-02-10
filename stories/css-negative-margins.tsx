import { styled } from '@compiled/react';

export default {
  title: 'styled/negative margins',
};

const gridSize = 8;

const LayoutRight = styled.aside`
  margin-right: -${gridSize * 5}px;
  margin-left: ${gridSize * 5}px;
  top: -${gridSize * 5}px;
  left: -${gridSize * 8}px;
  right: ${gridSize * 8}px;
  color: blue;
`;

export const Styled = (): JSX.Element => <LayoutRight>Layout Right</LayoutRight>;
