import { styled } from '@compiled/react';

const AnotherOne = styled.div`
  color: purple;
`;

AnotherOne.displayName = 'AnotherOne';

export default function TSComponent(props: { children: string }) {
  return <AnotherOne>{props.children}</AnotherOne>;
}
