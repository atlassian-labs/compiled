import { styled } from '@compiled/react';

export default {
  title: 'css prop/variable clash',
};

const isPrimary = false;
const Component = styled.div`
  color: ${({ isPrimary }) => (isPrimary ? 'green' : 'red')};
`;

export const UsingComponentWithProps = (): JSX.Element => {
  return <Component isPrimary>This should be green</Component>;
};

export const UsingComponentWithoutProps = (): JSX.Element => {
  return <Component>This should be red</Component>;
};
