import React from 'react';
import { styled, css } from '@compiled/react';
import {
  primaryTaggedTemplateExpression,
  secondaryTaggedTemplateExpression,
} from '../mixins/mixins';

export default {
  title: 'conditional rules/styled',
};

interface TextProps {
  isPrimary?: boolean;
  isBolded?: boolean;
  isMaybe?: boolean;
  children: React.ReactNode;
}

const TextWithTemplateLiteral = styled.span<TextProps>`
  color: red;
  ${(props) => (props.isPrimary || props.isBolded) && { color: 'blue' }};
  ${(props) => props.isPrimary && { fontSize: '20px' }};
`;

const TextWithTernaryOperatorTemplateLiteral = styled.span<TextProps>`
  color: ${(props) => (props.isPrimary ? 'blue' : 'red')};
  font-weight: ${(props) =>
    props.isPrimary && props.isMaybe ? (props.isBolded && 'bold') || 'normal' : 'light'};
`;

const TextWithObjectStyles = styled.span<TextProps>(
  { color: 'red' },
  (props) => props.isPrimary && { color: 'blue' },
  (props) => props.isBolded && { fontWeight: 'bold' },
  css`
    text-transform: uppercase;
  `
);

const TextWithTernaryAndBooleanObjectStyle = styled.span<TextProps>({ fontSize: '20px' }, (props) =>
  props.isPrimary && props.isBolded ? { color: 'blue', fontWeight: 'bold' } : { color: 'red' }
);

const TextWithMixins = styled.span<TextProps>`
  ${(props) =>
    props.isPrimary ? primaryTaggedTemplateExpression : secondaryTaggedTemplateExpression};
  padding: 10px;
`;

const InlineMixin = styled.div<TextProps>`
  ${(props) =>
    props.isPrimary
      ? css`
          color: green;
        `
      : css({
          color: 'red',
        })}
`;

const ComplexMixin = styled.div<TextProps>`
  ${(props) =>
    props.isPrimary
      ? css<TextProps>`
          color: green;
          font-weight: ${({ isBolded }) => (isBolded ? 'bold' : undefined)};
        `
      : 'color: red'};
`;

const KeyValueString = styled.div<TextProps>`
  ${(props) => (props.isPrimary ? 'color: green' : `color: red`)};
`;

const NoValuePath = styled.div<TextProps>`
  ${(props) => (props.isPrimary ? undefined : 'color: red')}
`;

export const PrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral isPrimary>Hello primary</TextWithTemplateLiteral>;
};

export const NotPrimaryTextWithTemplateLiteral = (): JSX.Element => {
  return <TextWithTemplateLiteral>Hello secondary</TextWithTemplateLiteral>;
};

export const PrimaryTextWithTernaryOperatorTemplateLiteral = (): JSX.Element => {
  return (
    <TextWithTernaryOperatorTemplateLiteral isPrimary isMaybe>
      Hello primary
    </TextWithTernaryOperatorTemplateLiteral>
  );
};

export const BoldedPrimaryTextWithTernaryOperatorTemplateLiteral = (): JSX.Element => {
  return (
    <TextWithTernaryOperatorTemplateLiteral isPrimary isMaybe isBolded>
      Hello bolded primary
    </TextWithTernaryOperatorTemplateLiteral>
  );
};

export const NotPrimaryTextWithTernaryOperatorTemplateLiteral = (): JSX.Element => {
  return (
    <TextWithTernaryOperatorTemplateLiteral>Hello secondary</TextWithTernaryOperatorTemplateLiteral>
  );
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

export const PrimaryTextWithTernaryAndBooleanObjectStyle = (): JSX.Element => {
  return (
    <TextWithTernaryAndBooleanObjectStyle isPrimary>
      {' '}
      Hello primary but not bolded. This should be red
    </TextWithTernaryAndBooleanObjectStyle>
  );
};

export const BoldedPrimaryTextWithTernaryAndBooleanObjectStyle = (): JSX.Element => {
  return (
    <TextWithTernaryAndBooleanObjectStyle isPrimary isBolded>
      {' '}
      Hello bolded primary
    </TextWithTernaryAndBooleanObjectStyle>
  );
};

export const NotPrimaryTextWithTernaryAndBooleanObjectStyle = (): JSX.Element => {
  return (
    <TextWithTernaryAndBooleanObjectStyle> Hello secondary</TextWithTernaryAndBooleanObjectStyle>
  );
};

export const PrimaryTextWithMixins = (): JSX.Element => {
  return <TextWithMixins isPrimary>Hello primary</TextWithMixins>;
};

export const SecondaryTextWithMixins = (): JSX.Element => {
  return <TextWithMixins>Hello secondary</TextWithMixins>;
};

export const TextWithInlineMixin = (): JSX.Element => (
  <div>
    <InlineMixin isPrimary>Using css``</InlineMixin>
    <InlineMixin isPrimary={false}>Using css()</InlineMixin>
  </div>
);

export const TextWithComplexMixin = (): JSX.Element => (
  <div>
    <ComplexMixin isPrimary isBolded>
      Primary text using mixin with bold condition
    </ComplexMixin>
    <ComplexMixin isPrimary isBolded={false}>
      Primary text using mixin without bold condition
    </ComplexMixin>
    <ComplexMixin isPrimary={false}>Secondary text</ComplexMixin>
  </div>
);

export const TextWithKeyValueString = (): JSX.Element => (
  <div>
    <KeyValueString isPrimary>color: green</KeyValueString>
    <KeyValueString isPrimary={false}>color: red</KeyValueString>
  </div>
);

export const ConditionWithNoValuePath = (): JSX.Element => {
  return (
    <div>
      <NoValuePath isPrimary>Primary path with no given CSS</NoValuePath>
      <NoValuePath>Secondary path with CSS</NoValuePath>
    </div>
  );
};
