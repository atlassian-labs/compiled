import React from 'react';
import { styled } from '@compiled/core';

export default {
  title: 'composing styles on user defined components',
};

interface Props {
  color: string;
  bgColor: string;
  borderStyle: string;
  padding: number;
}

const Component = (props: Props) => <h1 style={{ color: 'green' }} {...props} />;

const StyledObjectLiteral = styled(Component)<Props>({
  color: (props) => props.color,
  backgroundColor: (props) => {
    return props.bgColor;
  },
  border: `5px ${(props: Props) => props.borderStyle} black`,
  padding: `${(props: Props) => {
    return props.padding;
  }}px`,
});

const StyledTemplateLiteral = styled(Component)<Props>`
  color: ${(props) => props.color};
  background-color: ${(props) => {
    return props.bgColor;
  }};
  border: 5px ${(props) => props.borderStyle} black;
  padding: ${(props) => {
    return props.padding;
  }}px;
`;

export const ObjectLiteral = () => (
  <StyledObjectLiteral color="blue" bgColor="red" borderStyle="dashed" padding={8}>
    hello world
  </StyledObjectLiteral>
);

export const TemplateLiteral = () => (
  <StyledTemplateLiteral color="red" bgColor="blue" borderStyle="dotted" padding={10}>
    hello world
  </StyledTemplateLiteral>
);
