/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

const EmphasisText = (props) => (
  <span
    className={props.className}
    // <-- bug (no style prop!)
    css={css({
      color: '#00b8d9',
      textTransform: 'uppercase',
      fontWeight: 700,
    })}>
    {props.children}
  </span>
);

export const CustomColorText = (props) => (
  <EmphasisText css={{ color: props.color }}>{props.children}</EmphasisText>
);
