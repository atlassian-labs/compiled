/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
import type { ReactNode } from 'react';

type EmphasisTextProps = {
  children: ReactNode;
  className?: string;
  style?: any;
};

type CustomColorTextProps = {
  children: ReactNode;
  color: string;
};

const EmphasisText = (props: EmphasisTextProps) => (
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

export const CustomColorText = (props: CustomColorTextProps): JSX.Element => (
  <EmphasisText css={css({ color: props.color })}>{props.children}</EmphasisText>
);
