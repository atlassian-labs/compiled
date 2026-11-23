// @ts-expect-error -- cssMapScoped is intentionally not in the public @compiled/react types
// eslint-disable-next-line import/no-extraneous-dependencies, import/named
import { cssMapScoped } from '@compiled/react';

import cssMap from '../index';

// Verify cssMapScoped is exported and accepts the same styles object as cssMap.
const scopedStyles = cssMapScoped({ danger: { color: 'red' } });

// Verify cssMapScoped does NOT accept a second argument.
const scopedStylesWithExtraArg = cssMapScoped({ danger: { color: 'red' } }, {});

// Verify `@starting-style` directly contains styles, as it has no second half like `@media`.
const startingStyleStyles = cssMap({
  open: {
    color: 'red',
    '@starting-style': { opacity: 0, '&:hover': { color: 'blue' } },
    '@media': { '(min-width: 100px)': { '@starting-style': { opacity: 0 } } },
  },
});

// @ts-expect-error -- `@starting-style` must contain styles, not a record of preludes to styles.
const invalidStartingStyle = cssMap({ open: { '@starting-style': 'blue' } });

export { scopedStyles, scopedStylesWithExtraArg, startingStyleStyles, invalidStartingStyle };
