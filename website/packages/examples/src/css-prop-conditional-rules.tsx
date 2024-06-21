/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
import type { ReactNode } from 'react';

type LozengeProps = {
  children: ReactNode;
  primary: boolean;
};

export const Lozenge = (props: LozengeProps): JSX.Element => (
  <span
    css={[
      props.primary &&
        css({
          border: '3px solid pink',
          color: 'pink',
        }),
      !props.primary &&
        css({
          border: '3px solid blue',
          color: 'blue',
        }),
      css({
        padding: '4px 8px',
        fontWeight: 600,
        borderRadius: 3,
      }),
    ]}>
    {props.children}
  </span>
);
