import { css } from '@compiled/react';
import React from 'react';

// @ts-expect-error
const styles = css(false);

export const App = (): JSX.Element => <div css={styles} />;
