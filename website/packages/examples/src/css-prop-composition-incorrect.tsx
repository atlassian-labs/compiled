/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

type CustomColorTextProps = {
  children: React.ReactNode;
  color: string;
};

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

export const CustomColorText = (props: CustomColorTextProps): JSX.Element => (
  <EmphasisText css={{ color: props.color }}>{props.children}</EmphasisText>
);
