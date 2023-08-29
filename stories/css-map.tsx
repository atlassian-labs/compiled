import { cssMap } from '@compiled/react';
import { useState } from 'react';

export default {
  title: 'css map',
};

const styles = cssMap({
  success: {
    color: 'green',
    ':hover': {
      color: 'DarkGreen',
    },
    '@media (max-width: 800px)': {
      color: 'SpringGreen',
    },
  },
  danger: {
    color: 'red',
    ':hover': {
      color: 'DarkRed',
    },
    '@media (max-width: 800px)': {
      color: 'Crimson',
    },
  },
});

export const DynamicVariant = (): JSX.Element => {
  const [variant, setVariant] = useState<keyof typeof styles>('success');

  return (
    <>
      <div
        css={{
          '> *': {
            margin: '5px',
          },
        }}>
        <button onClick={() => setVariant('success')}>success</button>
        <button onClick={() => setVariant('danger')}>danger</button>
        <div css={styles[variant]}>hello world</div>
      </div>
    </>
  );
};

export const VariantAsProp = (): JSX.Element => {
  const Component = ({ variant }: { variant: keyof typeof styles }) => (
    <div css={styles[variant]}>hello world</div>
  );
  return <Component variant={'success'} />;
};

export const MergeStyles = (): JSX.Element => {
  return <div css={[styles.danger, { backgroundColor: 'green' }]}>hello world</div>;
};

export const ConditionalStyles = (): JSX.Element => {
  const isDanger = true;
  return <div css={styles[isDanger ? 'danger' : 'success']}>hello world</div>;
};
