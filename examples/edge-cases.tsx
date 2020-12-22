import { styled } from '@compiled/react';

const Container = styled.div<{ color?: string }>`
  border: 1px solid ${(props) => props.color};
  padding: 8px;
  margin: 8px;
`;

export default {
  title: 'edge cases | interpolations',
};

export const PreventCSSVariablesLeaking = () => {
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

export const ContentInterpolation = () => (
  <DynamicContent pre="i am before" post="i am after">
    middle
  </DynamicContent>
);
