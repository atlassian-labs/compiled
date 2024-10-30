/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
import type { ReactNode } from 'react';

type Props = { inverted?: boolean; children: ReactNode };

const largeTextStyles = css({
  fontSize: '48px',
  padding: '8px',
  background: '#eee',
});
const invertedStyles = css({
  background: '#333',
  color: '#fff',
});

export const LargeText = ({ inverted, children }: Props): JSX.Element => {
  return <span css={[largeTextStyles, inverted && invertedStyles]}>{children}</span>;
};
