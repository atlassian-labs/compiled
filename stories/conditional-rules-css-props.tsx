import '@compiled/react';

export default {
  title: 'conditional rules/css prop',
};

const Lozenge = (props: { isPrimary?: boolean; children: any }) => (
  <div
    css={{
      borderRadius: 3,
      display: 'inline-block',
      fontSize: 12,
      fontWeight: 500,
      padding: '2px 4px',
      ...(props.isPrimary && {
        border: '1px solid blue',
        color: 'blue',
      }),
      ...(!props.isPrimary && {
        border: '1px solid red',
        color: 'red',
      }),
    }}>
    {props.children}
  </div>
);

export const PrimaryLozenge = (): JSX.Element => {
  return <Lozenge isPrimary>Hello primay</Lozenge>;
};

export const NotPrimaryLozenge = (): JSX.Element => {
  return <Lozenge>Hello secondary</Lozenge>;
};

const LozengeWithArray = (props: { isPrimary?: boolean; children: any }) => (
  <div
    css={[
      {
        borderRadius: 3,
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 4px',
      },
      props.isPrimary && {
        border: '1px solid blue',
        color: 'blue',
      },

      !props.isPrimary && {
        border: '1px solid red',
        color: 'red',
      },
    ]}>
    {props.children}
  </div>
);

export const PrimaryLozengeWithArray = (): JSX.Element => {
  return <LozengeWithArray isPrimary>Hello primay</LozengeWithArray>;
};

export const NotPrimaryLozengeWithArray = (): JSX.Element => {
  return <LozengeWithArray>Hello secondary</LozengeWithArray>;
};
