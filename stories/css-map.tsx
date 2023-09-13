import { cssMap, css } from '@compiled/react';
import { useState } from 'react';

export default {
  title: 'css map',
};

const styles = cssMap({
  success: {
    color: '#0b0',
    '&:hover': {
      color: '#060',
    },
    // At-rules (@media, @screen, etc.)
    '@media': {
      'screen and (min-width: 500px)': {
        fontSize: '10vw',
      },
    },
    // Using the selectors object for any selectors
    // that we do not expressly support.
    selectors: {
      span: {
        color: 'lightgreen',
        '&:hover': {
          color: '#090',
        },
      },
    },
  },
  danger: {
    color: 'red',
    '&:hover': {
      color: 'DarkRed',
    },
    '@media': {
      'screen and (min-width: 500px)': {
        fontSize: '20vw',
      },
    },
    selectors: {
      span: {
        color: 'orange',
        '&:hover': {
          color: 'pink',
        },
      },
      '&:hover': { color: 'pink' },
    },
  },
});

export const DynamicVariant = (): JSX.Element => {
  const [variant, setVariant] = useState<keyof typeof styles>('success');

  return (
    <>
      <div
        css={css({
          '> *': {
            margin: '5px',
          },
        })}>
        <button onClick={() => setVariant('success')}>success</button>
        <button onClick={() => setVariant('danger')}>danger</button>
        <div css={styles[variant]}>
          hello <span>hello!</span> world
        </div>
      </div>
    </>
  );
};

export const VariantAsProp = (): JSX.Element => {
  const Component = ({ variant }: { variant: keyof typeof styles }) => (
    <div css={styles[variant]}>
      hello <span>hello!</span> world
    </div>
  );
  return <Component variant={'success'} />;
};

export const MergeStyles = (): JSX.Element => {
  return (
    <div css={[styles.danger, css({ backgroundColor: 'green' })]}>
      hello <span>hello!</span> world
    </div>
  );
};

export const ConditionalStyles = (): JSX.Element => {
  const isDanger = true;
  return (
    <div css={styles[isDanger ? 'danger' : 'success']}>
      hello <span>hello!</span> world
    </div>
  );
};
