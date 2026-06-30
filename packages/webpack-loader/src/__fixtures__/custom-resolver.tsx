/** @jsx jsx */
import { jsx, css } from '@compiled/react';
import type { JSX } from 'react';
// @ts-expect-error
import { primary } from 'test';

export const App = (): JSX.Element => <div css={css({ color: primary })} />;
