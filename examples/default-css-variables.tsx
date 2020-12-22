import { styled } from '@compiled/react';

const Container = styled.div<{ open: boolean; inherentHeight: number }>`
  max-height: ${(props) => (props.open ? props.inherentHeight : 0)}px;
  overflow: hidden;
`;

export default {
  title: 'dynamic | CSS declarations',
};

export const ShouldNotBeVisible = () => {
  return (
    <Container open={false} inherentHeight={200}>
      <div css={{ background: 'blue', height: 200, width: 200 }}>SHOULD NOT BE SEEN</div>
    </Container>
  );
};
