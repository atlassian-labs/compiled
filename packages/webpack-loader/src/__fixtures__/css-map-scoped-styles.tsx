/** @jsx jsx */
// @ts-expect-error cssMapScoped is not public api
// eslint-disable-next-line import/named
import { cssMapScoped, jsx } from '@compiled/react';

// Two cssMapScoped declarations with overlapping selectors — second must override first.
// In the extracted CSS, the override must come AFTER the base for cascade to work.
const baseStyles = cssMapScoped({
  default: { '.editor .panel': { backgroundColor: 'gray' } },
  override: { '.editor .panel': { backgroundColor: 'pink' } },
});

export const App = (): JSX.Element => <div css={[baseStyles.default, baseStyles.override]} />;
