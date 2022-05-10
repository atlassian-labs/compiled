import { styled } from '@compiled/react';

export default {
  title: 'css prop/variable clash',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isPrimary = false;
const Component = styled.div<{ isPrimary?: boolean }>`
  color: ${({ isPrimary }) => (isPrimary ? 'green' : 'red')};
`;

export const UsingComponentWithProps = (): JSX.Element => {
  return <Component isPrimary>This should be green</Component>;
};

export const UsingComponentWithoutProps = (): JSX.Element => {
  return <Component>This should be red</Component>;
};
