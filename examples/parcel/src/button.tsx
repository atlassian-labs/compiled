// @ts-nocheck
/** @jsx jsx */
import { jsx } from '@compiled/react';
import React from 'react';

import { cssMap, type StrictXCSSProp } from './css';

const buttonStyles = cssMap({
  container: {
    color: 'var(--ds-text-inverse)',
    backgroundColor: 'var(--ds-background-brand-bold)',
    borderRadius: 'var(--ds-border-radius-100)',
    border: 'none',
    paddingBlock: 'var(--ds-space-150)',
    paddingInline: 'var(--ds-space-100)',
    '&:hover': {
      backgroundColor: 'var(--ds-background-brand-bold-hovered)',
    },
    '&:active': {
      backgroundColor: 'var(--ds-background-brand-bold-pressed)',
    },
  },
});

export function Button({
  children,
  xcss,
}: {
  children: React.ReactNode;
  xcss?: StrictXCSSProp<'color' | 'backgroundColor', '&:hover' | '&:active'>;
}): JSX.Element {
  return (
    <button style={{ fontWeight: '500' }} css={buttonStyles.container} className={xcss}>
      {children}
    </button>
  );
}
