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

const ComponentWithCSSProp = (props: Props) => <h1 {...props} css={{ color: 'green' }} />;

const StyledComponent = styled.h1`
  color: green;
`;

const StyledObjectLiteralWithCSSPropComponent = styled(ComponentWithCSSProp)<Props>({
  color: (props: Props) => props.color,
  backgroundColor: (props: Props) => {
    return props.bgColor;
  },
  border: `5px ${(props: Props) => props.borderStyle} black`,
  padding: `${(props: Props) => {
    return props.padding;
  }}px`,
});
const StyledObjectLiteralWithStyledComponent = styled(StyledComponent)<Props>({
  color: (props: Props) => props.color,
  backgroundColor: (props: Props) => {
    return props.bgColor;
  },
  border: `5px ${(props: Props) => props.borderStyle} black`,
  padding: `${(props: Props) => {
    return props.padding;
  }}px`,
});

const StyledTemplateLiteralWithCSSPropComponent = styled(ComponentWithCSSProp)<Props>`
  color: ${(props: Props) => props.color};
  background-color: ${(props: Props) => {
    return props.bgColor;
  }};
  border: 5px ${(props: Props) => props.borderStyle} black;
  padding: ${(props: Props) => {
    return props.padding;
  }}px;
`;
const StyledTemplateLiteralWithStyledComponent = styled(StyledComponent)<Props>`
  color: ${(props: Props) => props.color};
  background-color: ${(props: Props) => {
    return props.bgColor;
  }};
  border: 5px ${(props: Props) => props.borderStyle} black;
  padding: ${(props: Props) => {
    return props.padding;
  }}px;
`;

export const ObjectLiteral = () => (
  <>
    <StyledObjectLiteralWithCSSPropComponent
      color="blue"
      bgColor="red"
      borderStyle="dashed"
      padding={8}>
      hello world component with css prop
    </StyledObjectLiteralWithCSSPropComponent>
    <StyledObjectLiteralWithStyledComponent
      color="red"
      bgColor="blue"
      borderStyle="dotted"
      padding={8}>
      hello world styled component
    </StyledObjectLiteralWithStyledComponent>
  </>
);

export const TemplateLiteral = () => (
  <>
    <StyledTemplateLiteralWithCSSPropComponent
      color="red"
      bgColor="blue"
      borderStyle="dotted"
      padding={10}>
      hello world component with css prop
    </StyledTemplateLiteralWithCSSPropComponent>
    <StyledTemplateLiteralWithStyledComponent
      color="blue"
      bgColor="red"
      borderStyle="dashed"
      padding={10}>
      hello world styled component
    </StyledTemplateLiteralWithStyledComponent>
  </>
);
