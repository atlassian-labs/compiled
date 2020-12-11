import React from 'react';
import { styled } from '@compiled/react';

export default {
  title: 'styled | interpolations',
};

interface Props {
  color: string;
  bgColor: string;
  textSize: number;
  borderStyle: string;
  padding: number;
}

const FunctionStyledObjectLiteral = styled.div<Props>({
  color: ({ color }) => color,
  fontSize: (props) => `${props.textSize}px`,
  backgroundColor: (props) => {
    return props.bgColor;
  },
  border: `5px ${({ borderStyle }: Props) => borderStyle} black`,
  padding: `${(props: Props) => {
    return props.padding;
  }}px`,
});

const FunctionStyledTemplateLiteral = styled.div<Props>`
  color: ${({ color }) => color};
  font-size: ${(props) => props.textSize}px;
  background-color: ${(props) => {
    return props.bgColor;
  }};
  border: 5px ${({ borderStyle }) => borderStyle} black;
  padding: ${(props) => {
    return props.padding;
  }}px;
`;

export const ObjectLiteral = () => (
  <FunctionStyledObjectLiteral
    color="blue"
    bgColor="red"
    textSize={18}
    borderStyle="dashed"
    padding={8}>
    hello world
  </FunctionStyledObjectLiteral>
);

export const TemplateLiteral = () => (
  <FunctionStyledTemplateLiteral
    color="red"
    bgColor="blue"
    textSize={20}
    borderStyle="dotted"
    padding={10}>
    hello world
  </FunctionStyledTemplateLiteral>
);
