/** @jsx jsx */
import { jsx, css } from '@compiled/react';
import type { JSX } from 'react';

// @ts-expect-error
const styles = css(false);

export const App = (): JSX.Element => <div css={styles} />;
