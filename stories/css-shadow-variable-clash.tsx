import { styled } from '@compiled/react';

export default {
  title: 'Test/PropDestructed',
};

//const isPrimary = false;
// const random = (isPrimary) => {
//   return isPrimary ? 'green' : 'red';
// }
const Component1 = styled.p`
  color: ${({ isPrimary }) => (isPrimary ? 'green' : 'red')};
`;
// const Component2 = styled.p`
//   color: ${random(props.isPrimary)}
// `;

export const UsingComponent1 = (): JSX.Element => {
  return <Component1 isPrimary={true}>Component1</Component1>;
};
