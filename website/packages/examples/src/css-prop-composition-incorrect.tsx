/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

const EmphasisText = (props) => (
  <span
    {...props}
    // ^--- className and style not statically defined - bug!
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
