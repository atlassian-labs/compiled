import { styled } from '@compiled/react';

export default {
  title: 'css prop/variable clash',
};

const isPrimary = false;
const Component = styled.div`
  width: ${({ size: { width } }) => (width ? `${width}px` : '100%')};
`;
console.log(isPrimary);

export const UsingComponentWithProps = (): JSX.Element => {
  const obj = { width: 600 };
  return <Component size={obj}>This should be green</Component>;
};

// export const UsingComponentWithoutProps = (): JSX.Element => {
//   return <Component>This should be red</Component>;
// };
