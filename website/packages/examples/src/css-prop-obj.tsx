/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
import type { ReactNode } from 'react';

type EmphasisTextProps = {
  children: ReactNode;
};

const styles = css({
  color: '#00b8d9',
  textTransform: 'uppercase',
  fontWeight: 700,
});

export const EmphasisText = ({ children }: EmphasisTextProps): JSX.Element => (
  <span css={styles}>{children}</span>
);
