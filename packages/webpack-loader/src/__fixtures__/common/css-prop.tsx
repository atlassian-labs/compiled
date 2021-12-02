/** @jsx jsx */
import { jsx } from '@compiled/react';

import { coral } from './colors';

export const Coral = (): JSX.Element => (
  <div css={{ color: coral, border: `2px solid ${coral}` }} />
);
