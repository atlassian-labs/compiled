import { styled } from '@compiled/react';

export default {
  title: 'css prop/variable clash',
};

const isPrimary = true;
const Component1 = styled.p`
  color: ${({ isPrimary }) => (isPrimary ? 'green' : 'red')};
`;

export const UsingComponent1 = (): JSX.Element => {
  return <Component1 isPrimary={false}>Component1</Component1>;
};
