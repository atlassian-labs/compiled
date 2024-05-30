/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

export const EmphasisText = (props) => (
  <span
    css={css({
      color: '#00b8d9',
      textTransform: 'uppercase',
      fontWeight: 700,
    })}>
    {props.children}
  </span>
);
