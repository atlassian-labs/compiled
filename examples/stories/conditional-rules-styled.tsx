import React from 'react';
import { styled } from '@compiled/react';

export default {
  title: 'conditional rules/styled',
};

interface TextProps {
  isPrimary?: boolean;
  isBolded?: boolean;
  isMaybe?: boolean;
  children: React.ReactNode;
}

const TextWithTernaryOperator = styled.span<TextProps>`
  color: ${(props) => (props.isPrimary ? 'blue' : 'red')};
  font-weight: ${(props) =>
    props.isPrimary && props.isMaybe ? (props.isBolded && 'bold') || 'normal' : 'light'};
`;

const TextWithTemplateLiteral = styled.span<TextProps>`
  color: red;
  ${(props) => (props.isPrimary || props.isMaybe) && { color: 'blue' }};
  ${(props) => props.isPrimary && { fontSize: '20px' }};
  font-weight: ${(props) => props.isBolded && props.isPrimary && 'bold'};
`;

const TextWithObjectStyles = styled.span<TextProps>(
  { color: 'red' },
  (props) => props.isPrimary && { color: 'blue' },
  (props) => props.isBolded && { fontWeight: 'bold' }
);

const TextWithTernaryAndBoolean = styled.span<TextProps>({ fontSize: '20px' }, (props) =>
  props.isPrimary && props.isBolded ? { color: 'blue', fontWeight: 'bold' } : { color: 'red' }
);

export const PrimaryTextWithTernaryOperator = (): JSX.Element => {
  return (
    <TextWithTernaryOperator isPrimary isMaybe>
      Hello primary
    </TextWithTernaryOperator>
  );
};

export const BoldedPrimaryTextWithTernaryOperator = (): JSX.Element => {
  return (
    <TextWithTernaryOperator isPrimary isMaybe isBolded>
      Hello bolded primary
    </TextWithTernaryOperator>
  );
};

export const NotPrimaryTextWithTernaryOperator = (): JSX.Element => {
  return <TextWithTernaryOperator>Hello secondary</TextWithTernaryOperator>;
};

export const PrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral isPrimary>Hello primary</TextWithTemplateLiteral>;
};

export const BoldedPrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return (
    <TextWithTemplateLiteral isPrimary isBolded>
      Hello bolded primary
    </TextWithTemplateLiteral>
  );
};

export const NotPrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral isBolded>Hello secondary</TextWithTemplateLiteral>;
};

export const PrimaryTextWithObjectStyles = (): JSX.Element => {
  return <TextWithObjectStyles isPrimary>Hello primary</TextWithObjectStyles>;
};

export const BoldedPrimaryTextWithObjectStyles = (): JSX.Element => {
  return (
    <TextWithObjectStyles isPrimary isBolded>
      Hello bolded primary
    </TextWithObjectStyles>
  );
};

export const NotPrimaryTextWithObjectStyles = (): JSX.Element => {
  return <TextWithObjectStyles>Hello secondary</TextWithObjectStyles>;
};

export const PrimaryTextWithTernaryAndBoolean = (): JSX.Element => {
  return (
    <TextWithTernaryAndBoolean isPrimary>
      {' '}
      Hello primary but not bolded. This should be red
    </TextWithTernaryAndBoolean>
  );
};

export const BoldedPrimaryTextWithTernaryAndBoolean = (): JSX.Element => {
  return (
    <TextWithTernaryAndBoolean isPrimary isBolded>
      {' '}
      Hello bolded primary
    </TextWithTernaryAndBoolean>
  );
};

export const NotPrimaryTextWithTernaryAndBoolean = (): JSX.Element => {
  return <TextWithTernaryAndBoolean> Hello secondary</TextWithTernaryAndBoolean>;
};
