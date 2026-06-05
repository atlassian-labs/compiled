// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap } from '@compiled/react';

const styles = cssMap({ danger: { color: 'red' } });

// Verify hashStrategy is NOT part of the public type signature.
// If this @ts-expect-error ever becomes unnecessary, hashStrategy has been accidentally re-exposed.
// @ts-expect-error - hashStrategy is experimental and intentionally omitted from the public API.
const stylesWithHashStrategy = cssMap({ danger: { color: 'red' } }, { hashStrategy: 'max' });

export { styles, stylesWithHashStrategy };
