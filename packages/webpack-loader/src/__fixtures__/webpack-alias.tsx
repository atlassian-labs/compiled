/** @jsx jsx */
// @ts-expect-error This is a bug where the meta is not updated for the new file import
import { jsx, css } from '@compiled/react';
import type { JSX } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-expect-error
import { styles } from 'webpack-alias';

export const App = (): JSX.Element => <div css={styles} />;
