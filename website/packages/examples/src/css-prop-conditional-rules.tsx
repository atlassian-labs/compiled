/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

export const Lozenge = (props) => (
  <span
    css={[
      props.primary && css({
        border: '3px solid pink',
        color: 'pink',
      }),
      !props.primary && css({
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
