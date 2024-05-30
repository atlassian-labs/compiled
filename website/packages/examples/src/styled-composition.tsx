import { styled } from '@compiled/react';

const RedText = styled.span({
  color: 'red',
});

export const BlueText = styled(RedText)({
  color: 'blue'
});
