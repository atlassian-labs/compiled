// eslint-disable-next-line import/no-extraneous-dependencies
import { keyframes } from '@compiled/react';

export const fadeOut = keyframes({
  from: {
    opacity: 1,
  },
  to: {
    opacity: 0,
  },
});

export const namedFadeOut = fadeOut;

export default fadeOut;
