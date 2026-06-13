// @ts-expect-error -- cssMapScoped is intentionally not in the public @compiled/react types
// eslint-disable-next-line import/no-extraneous-dependencies, import/named
import { cssMapScoped } from '@compiled/react';

// Verify cssMapScoped is exported and accepts the same styles object as cssMap.
const scopedStyles = cssMapScoped({ danger: { color: 'red' } });

// Verify cssMapScoped does NOT accept a second argument.
const scopedStylesWithExtraArg = cssMapScoped({ danger: { color: 'red' } }, {});

export { scopedStyles, scopedStylesWithExtraArg };
