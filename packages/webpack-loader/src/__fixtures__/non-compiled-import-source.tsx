/** @jsx jsx */
// @ts-expect-error -- fake package
import { jsx } from '@other/css';
import type { JSX } from 'react';

// @ts-expect-error -- fake package
export const App = (): JSX.Element => <div css={{ margin: 0 }} />;
