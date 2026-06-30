/** @jsx jsx */
// @ts-expect-error cssMapScoped is not public api
// eslint-disable-next-line import/named
import { cssMapScoped, jsx } from '@compiled/react';
import type { JSX } from 'react';

// Base panel styles (non-atomic) — defined in a different file from the
// override styles to verify cross-file non-atomic source order preservation.
export const baseStyles = cssMapScoped({
  default: { '.editor .panel': { backgroundColor: 'gray' } },
});

export const Base = (): JSX.Element => <div css={baseStyles.default} />;
