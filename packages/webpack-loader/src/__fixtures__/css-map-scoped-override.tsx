/** @jsx jsx */
// @ts-expect-error cssMapScoped is not public api
// eslint-disable-next-line import/named
import { cssMapScoped, jsx } from '@compiled/react';

// Override panel styles (non-atomic) — must appear AFTER baseStyles in the
// extracted CSS for cascade overrides to win.
export const overrideStyles = cssMapScoped({
  default: { '.editor .panel': { backgroundColor: 'pink' } },
});

export const Override = (): JSX.Element => <div css={overrideStyles.default} />;
