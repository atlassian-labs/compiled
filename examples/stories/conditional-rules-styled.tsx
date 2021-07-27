import { styled } from '@compiled/react';

export default {
  title: 'conditional rules/styled',
};
interface TextProps {
  isPrimary?: boolean;
  children: any;
}

const TextWithTernaryOperator = styled.span<TextProps>`
  color: ${(props) => (props.isPrimary ? 'blue' : 'red')};
`;

const TextWithTemplateLiteral = styled.span<TextProps>`
  color: red;
  ${(props) => props.isPrimary && { color: 'blue' }};
`;

const TextWithObjectStyles = styled.span<TextProps>(
  { color: 'red' },
  (props) => props.isPrimary && { color: 'blue' }
);

export const PrimaryTextWithTernaryOperator = (): JSX.Element => {
  return <TextWithTernaryOperator isPrimary>Hello primary</TextWithTernaryOperator>;
};

export const NotPrimaryTextWithTernaryOperator = (): JSX.Element => {
  return <TextWithTernaryOperator>Hello secondary</TextWithTernaryOperator>;
};

export const PrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral isPrimary>Hello primary</TextWithTemplateLiteral>;
};

export const NotPrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral>Hello secondary</TextWithTemplateLiteral>;
};

export const PrimaryTextWithObjectStyles = (): JSX.Element => {
  return <TextWithObjectStyles isPrimary>Hello primary</TextWithObjectStyles>;
};

export const NotPrimaryTextWithObjectStyles = (): JSX.Element => {
  return <TextWithObjectStyles>Hello secondary</TextWithObjectStyles>;
};
