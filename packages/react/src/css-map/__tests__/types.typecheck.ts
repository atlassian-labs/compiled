// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap } from '@compiled/react';
// @ts-expect-error -- cssMapScoped is intentionally not in the public @compiled/react types
// eslint-disable-next-line import/no-extraneous-dependencies, import/named
import { cssMapScoped } from '@compiled/react';

const styles = cssMap({ danger: { color: 'red' } });

// Verify cssMap does NOT accept a second argument.
// If this @ts-expect-error ever becomes unnecessary, a second arg has been accidentally re-exposed.
// @ts-expect-error -- cssMap only accepts one argument
const stylesWithExtraArg = cssMap({ danger: { color: 'red' } }, {});

// Verify cssMapScoped is exported and accepts the same styles object as cssMap.
const scopedStyles = cssMapScoped({ danger: { color: 'red' } });

// Verify cssMapScoped does NOT accept a second argument.
const scopedStylesWithExtraArg = cssMapScoped({ danger: { color: 'red' } }, {});

export { styles, stylesWithExtraArg, scopedStyles, scopedStylesWithExtraArg };
