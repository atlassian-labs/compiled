import React from 'react';
// @ts-expect-error
import { styles } from 'loader-alias';
// @ts-ignore This is a bug where the meta is not updated for the new file import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { css } from '@compiled/react';

export const App = (): JSX.Element => <div css={styles} />;
