/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

const EmphasisText = (props) => (
  <span
    className={props.className}
    style={props.style}
    css={css({
      color: '#00b8d9',
      textTransform: 'uppercase',
      fontWeight: 700,
    })}>
    {props.children}
  </span>
);

export const CustomColorText = (props) => (
  <EmphasisText css={css({ color: props.color })}>{props.children}</EmphasisText>
);
