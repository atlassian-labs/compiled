import { styled } from '@compiled/react';
import { primary } from './module';

const HelloWorld = styled.div`
  color: ${primary};
  font-weight: 500;
`;

export default function TSComponent(props: { children: string }) {
  return <HelloWorld>{props.children}</HelloWorld>;
}
