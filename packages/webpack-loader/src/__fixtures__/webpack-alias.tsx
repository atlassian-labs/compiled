/** @jsx jsx */
// @ts-expect-error This is a bug where the meta is not updated for the new file import
import { jsx } from '@compiled/react';
import type { JSX } from 'react';
// @ts-expect-error
import { styles } from 'webpack-alias';

export const App = (): JSX.Element => <div css={styles} />;
