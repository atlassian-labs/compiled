/** @jsx jsx */
import { jsx, css } from '@compiled/react';
import type { JSX } from 'react';
// @ts-ignore This is a bug where the meta is not updated for the new file import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-expect-error
import { primary } from 'test';

export const App = (): JSX.Element => <div css={css({ color: primary })} />;
