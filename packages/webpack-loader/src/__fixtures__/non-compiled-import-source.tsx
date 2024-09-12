/** @jsx jsx */
// @ts-expect-error -- fake package
import { jsx } from '@other/css';

// @ts-expect-error -- fake package
export const App = (): JSX.Element => <div css={{ margin: 0 }} />;
