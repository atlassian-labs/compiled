import { styled } from '@compiled/react';

export const HorizontalStack = styled.div<{ spacing?: number; gap?: number }>`
  margin-top: ${({ spacing }) => spacing}rem;
  margin-bottom: ${({ spacing }) => spacing}rem;

  && > * {
    margin-right: ${(props) => props.gap}rem;

    &:last-child {
      margin-right: 0;
    }
  }
`;

export const VerticalStack = styled.div<{
  spacing?: number;
  gap?: number;
  align?: 'left' | 'right';
}>`
  margin-top: ${(props) => props.spacing}rem;
  margin-bottom: ${(props) => props.spacing}rem;
  text-align: ${(props) => props.align};

  && > * {
    margin-bottom: ${(props) => props.gap}rem;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;
