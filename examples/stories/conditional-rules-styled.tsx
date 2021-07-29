import { styled } from '@compiled/react';

export default {
  title: 'conditional rules/styled',
};

interface TextProps {
  isPrimary?: boolean;
  isBolded?: boolean;
  children: any;
}

const TextWithTernaryOperator = styled.span<TextProps>`
  color: ${(props) => (props.isPrimary ? 'blue' : 'red')};
  font-weight: ${(props) => (props.isBolded ? 'bold' : 'normal')};
`;

const TextWithTemplateLiteral = styled.span<TextProps>`
  color: red;
  ${(props) => props.isPrimary && { color: 'blue' }};
  ${(props) => props.isBolded && { fontWeight: 'bold'}};
`;

const TextWithObjectStyles = styled.span<TextProps>(
  { color: 'red' },
  (props) => props.isPrimary && { color: 'blue' },
  (props) => props.isBolded && { fontWeight: 'bold' }
);

const TextWithMixedStyle = styled.span<TextProps>(
  { color: 'red'},
  (props) => props.isPrimary && { color: 'blue' },
  { fontWeight: (props) => (props.isBolded ? 'bold' : 'normal')}
);

export const PrimaryTextWithTernaryOperator = (): JSX.Element => {
  return <TextWithTernaryOperator isPrimary>Hello primary</TextWithTernaryOperator>;
};

export const BoldedPrimaryTextWithTernaryOperator = (): JSX.Element => {
  return <TextWithTernaryOperator isPrimary isBolded>Hello bolded primary</TextWithTernaryOperator>;
};

export const NotPrimaryTextWithTernaryOperator = (): JSX.Element => {
  return <TextWithTernaryOperator>Hello secondary</TextWithTernaryOperator>;
};

export const PrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral isPrimary>Hello primary</TextWithTemplateLiteral>;
};

export const BoldedPrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral isPrimary isBolded>Hello bolded primary</TextWithTemplateLiteral>;
};

export const NotPrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral>Hello secondary</TextWithTemplateLiteral>;
};

export const PrimaryTextWithObjectStyles = (): JSX.Element => {
  return <TextWithObjectStyles isPrimary>Hello primary</TextWithObjectStyles>;
};

export const BoldedPrimaryTextWithObjectStyles = (): JSX.Element => {
  return <TextWithObjectStyles isPrimary isBolded>Hello bolded primary</TextWithObjectStyles>;
};

export const NotPrimaryTextWithObjectStyles = (): JSX.Element => {
  return <TextWithObjectStyles>Hello secondary</TextWithObjectStyles>;
};

export const PrimaryTextWithMixStyles = () : JSX.Element => {
  return <TextWithMixedStyle isPrimary> Hello primary</TextWithMixedStyle>
};

export const BoldedPrimaryTextWithMixStyles = () : JSX.Element => {
  return <TextWithMixedStyle isPrimary isBolded> Hello bolded primary</TextWithMixedStyle>
};

export const NotPrimaryTextWithMixStyles = () : JSX.Element => {
  return <TextWithMixedStyle> Hello primary</TextWithMixedStyle>
};

