/** @jsxImportSource @compiled/react */

import type { ReactNode } from 'react';

type Props = {
  color: string;
  children: ReactNode;
};

export const LargeText = (props: Props): JSX.Element => (
  <span
    css={{
      color: props.color,
      fontSize: 48,
    }}>
    {props.children}
  </span>
);
