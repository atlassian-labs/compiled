import { styled } from '@compiled/react';

export const TransientProps = styled.span<{ $color: string; color: string }>({
  color: (props) => props.$color,
  backgroundColor: (props) => props.color
});
