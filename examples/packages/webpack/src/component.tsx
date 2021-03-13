import { styled } from '@compiled/react';
import { primary } from './module';

const HelloWorld = styled.div`
  color: ${primary};
  font-weight: 500;

  :hover {
    color: red;
  }

  :focus {
    color: blue;
  }
`;

export default function TSComponent(props: { children: string }): JSX.Element {
  return <HelloWorld tabIndex={0}>{props.children}</HelloWorld>;
}
