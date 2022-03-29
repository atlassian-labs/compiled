import { styled, css } from '@compiled/react';

import { spacing } from './mixins';

export default {
  title: 'ast/binary expression',
};

const commonStyles = css`
  background-color: green;
  color: white;
`;

export const StaticValues = (): JSX.Element => {
  const Component = styled.div`
    ${commonStyles};
    padding: ${1 + 2 - 1}px;
  `;

  return <Component>Static values - padding: 1 + 2 - 1</Component>;
};

export const Multiplication = (): JSX.Element => {
  const Component = styled.div`
    ${commonStyles};
    padding: ${spacing * 3}px;
  `;

  return <Component>Multiplication - padding: spacing * 3</Component>;
};

export const Division = (): JSX.Element => {
  const Component = styled.div`
    ${commonStyles};
    padding: ${spacing / 2}px;
  `;

  return <Component>Division - padding: spacing / 2</Component>;
};

export const NegativeValue = (): JSX.Element => {
  const Component = styled.div`
    ${commonStyles};
    margin-top: ${-spacing / 2}px;
  `;

  return <Component>Negative value - margin-top: -spacing / 2</Component>;
};

export const NestedBinary = (): JSX.Element => {
  const Component = styled.div`
    ${commonStyles};
    padding: ${(spacing * 5) / 2}px;
  `;

  return <Component>Nested binary - padding: spacing * 5 / 2</Component>;
};

export const OrderOfOperations = (): JSX.Element => {
  const Component = styled.div`
    ${commonStyles};
    padding: ${5 * (spacing + 2)}px;
  `;

  return <Component>Order of operations - padding: 5 * (spacing + 2)</Component>;
};

export const CalcUtility = (): JSX.Element => {
  const Component = styled.div`
    ${commonStyles};
    width: calc(100% - ${spacing * 2}px);
  `;

  return <Component>calc() utility - width: calc(100% - spacing * 2)</Component>;
};

export const NonStaticValues = (): JSX.Element => {
  const random = Math.random;
  const Component = styled.div`
    ${commonStyles};
    /* 
      Using these properties so randomness does not cause
      visual difference for tests
    */
    left: -${random() * 10}px;
    right: ${random() * 10}px;
  `;

  return (
    <Component>
      <div>Non static values</div>
      <div>left: -random() * 10</div>
      <div>right: random() * 10</div>
    </Component>
  );
};
