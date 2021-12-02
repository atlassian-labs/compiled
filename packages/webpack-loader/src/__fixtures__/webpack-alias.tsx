/** @jsx jsx */
// @ts-expect-error This is a bug where the meta is not updated for the new file import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsx, css } from '@compiled/react';
// @ts-expect-error
import { styles } from 'webpack-alias';

export const App = (): JSX.Element => <div css={styles} />;
