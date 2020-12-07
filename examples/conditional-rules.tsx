import React from 'react';
import '@compiled/react';

export default {
  title: 'conditional rules | css prop',
};

const Lozenge = (props: { isPrimary?: boolean; children: any }) => (
  <div
    css={{
      fontWeight: 500,
      fontSize: 12,
      display: 'inline-block',
      borderRadius: 3,
      padding: '2px 4px',
      ...(props.isPrimary && {
        color: 'blue',
        border: '1px solid blue',
      }),
      ...(!props.isPrimary && {
        color: 'red',
        border: '1px solid red',
      }),
    }}>
    {props.children}
  </div>
);

export const PrimaryLozenge = () => {
  return <Lozenge isPrimary>Hello primay</Lozenge>;
};

export const NotPrimaryLozenge = () => {
  return <Lozenge>Hello secondary</Lozenge>;
};
