import * as React from 'react';
import { styled } from '@compiled/react';

const Container = styled.div<{ color?: string }>`
  border: 1px solid ${(props) => props.color};
  padding: 8px;
  margin: 8px;
`;

export default {
  title: 'edge cases | interpolations',
};

export const DontBleed = () => {
  return (
    <Container color="pink">
      border should be pink
      <Container>border should be black</Container>
    </Container>
  );
};
