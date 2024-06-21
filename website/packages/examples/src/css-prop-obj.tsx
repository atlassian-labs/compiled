/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
import type { ReactNode } from 'react';

type EmphasisTextProps = {
  children: ReactNode;
};

export const EmphasisText = (props: EmphasisTextProps): JSX.Element => (
  <span
    css={css({
      color: '#00b8d9',
      textTransform: 'uppercase',
      fontWeight: 700,
    })}>
    {props.children}
  </span>
);
