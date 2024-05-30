/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

export const EmphasisText = (props) => (
  <span
    css={css({
      color: props.primary ? '#00B8D9' : '#36B37E',
      fontWeight: 600,
    })}>
    {props.children}
  </span>
);
