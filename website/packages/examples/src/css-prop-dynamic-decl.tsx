/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
import type { ReactNode } from 'react';

type EmphasisTextProps = {
  children: ReactNode;
  primary: boolean;
};

export const EmphasisText = (props: EmphasisTextProps): JSX.Element => (
  <span
    css={css({
      color: props.primary ? '#00B8D9' : '#36B37E',
      fontWeight: 600,
    })}>
    {props.children}
  </span>
);
