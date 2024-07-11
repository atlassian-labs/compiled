/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
import type { ReactNode } from 'react';

type LozengeProps = {
  children: ReactNode;
  primary: boolean;
};

const primaryStyles = css({
  border: '3px solid pink',
  color: 'pink',
});

const notPrimaryStyles = css({
  border: '3px solid blue',
  color: 'blue',
});

const moreStyles = css({
  // any styles here will override what is in
  // primaryStyles and notPrimaryStyles
  padding: '4px 8px',
  fontWeight: 600,
  borderRadius: 3,
});

export const Lozenge = ({ children, primary }: LozengeProps): JSX.Element => (
  <span css={[primary && primaryStyles, !primary && notPrimaryStyles, moreStyles]}>{children}</span>
);
