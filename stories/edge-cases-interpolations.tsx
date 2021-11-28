import { styled } from '@compiled/react';

const Container = styled.div<{ color?: string }>`
  border: 1px solid ${(props) => props.color};
  padding: 8px;
  margin: 8px;
`;

export default {
  title: 'edge cases/interpolations',
};

export const PreventCSSVariablesLeaking = (): JSX.Element => {
  return (
    <Container color="pink">
      border should be pink
      <Container>border should be black</Container>
    </Container>
  );
};

const DynamicContent = styled.div<{ pre: string; post: string }>`
  padding: 8px;
  color: red;

  :before {
    content: '${(props) => props.pre}';
    margin-right: 8px;
    color: pink;
  }

  :after {
    content: '${(props) => props.post}';
    margin-left: 8px;
    color: blue;
  }
`;

export const ContentInterpolation = (): JSX.Element => (
  <DynamicContent pre="i am before" post="i am after">
    middle
  </DynamicContent>
);

const NoVisible = styled.div<{ open: boolean; inherentHeight: number }>`
  max-height: ${(props) => (props.open ? props.inherentHeight : 0)}px;
  overflow: hidden;
`;

export const ShouldNotBeVisible = (): JSX.Element => {
  return (
    <>
      <div>this should be visible</div>
      <NoVisible open={false} inherentHeight={200}>
        <div css={{ background: 'pink', height: 200, width: 200 }}>this should NOT be visible</div>
      </NoVisible>
    </>
  );
};
